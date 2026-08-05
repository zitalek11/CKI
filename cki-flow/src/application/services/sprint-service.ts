import type { UnitOfWork } from '@/application/ports/unit-of-work'
import { scheduleWorkItems } from '@/domain/engines/planning/schedule'
import type { Sprint, SprintAssignment, UserStory, WorkItem } from '@/domain/model/entities'
import { StoryStatus } from '@/domain/model/enums'
import { DomainError } from '@/domain/model/errors'
import { createId } from '@/domain/model/ids'
import { calculateStoryProgress } from '@/domain/rules/progress'
import { logger } from '@/shared/lib/logger'

export type SprintBoardItem = {
  story: UserStory
  progress: number
  workItemCount: number
  remainingHours: number
  forecastStart?: string
  forecastEnd?: string
}

export class SprintService {
  private readonly uow: UnitOfWork

  constructor(uow: UnitOfWork) {
    this.uow = uow
  }

  async getActiveSprint(productId: string): Promise<Sprint | undefined> {
    const db = await this.uow.read()
    return db.sprints.find((sprint) => sprint.productId === productId && sprint.status === 'active')
  }

  async listCommitted(productId: string): Promise<SprintBoardItem[]> {
    const db = await this.uow.read()
    const sprint = db.sprints.find((item) => item.productId === productId && item.status === 'active')
    if (!sprint) return []

    const storyIds = new Set(
      db.sprintAssignments
        .filter((assignment) => assignment.sprintId === sprint.id && assignment.targetType === 'user_story')
        .map((assignment) => assignment.targetId),
    )

    return db.userStories
      .filter((story) => storyIds.has(story.id))
      .map((story) => {
        const workItems = db.workItems.filter((item) => item.userStoryId === story.id)
        const starts = workItems.map((item) => item.forecastStart).filter(Boolean).sort()
        const ends = workItems.map((item) => item.forecastEnd).filter(Boolean).sort()
        return {
          story,
          progress: calculateStoryProgress(workItems),
          workItemCount: workItems.length,
          remainingHours: workItems
            .filter((item) => item.status !== 'done' && item.status !== 'cancelled')
            .reduce((sum, item) => sum + item.estimateHours, 0),
          forecastStart: starts[0],
          forecastEnd: ends[ends.length - 1],
        }
      })
  }

  async listReadyBacklog(productId: string): Promise<SprintBoardItem[]> {
    const db = await this.uow.read()
    const sprint = db.sprints.find((item) => item.productId === productId && item.status === 'active')
    const committed = new Set(
      sprint
        ? db.sprintAssignments
            .filter((assignment) => assignment.sprintId === sprint.id && assignment.targetType === 'user_story')
            .map((assignment) => assignment.targetId)
        : [],
    )

    return db.userStories
      .filter(
        (story) =>
          story.productId === productId &&
          !committed.has(story.id) &&
          story.status !== StoryStatus.Cancelled &&
          story.status !== StoryStatus.Archived &&
          story.status !== StoryStatus.Done,
      )
      .map((story) => {
        const workItems = db.workItems.filter((item) => item.userStoryId === story.id)
        return {
          story,
          progress: calculateStoryProgress(workItems),
          workItemCount: workItems.length,
          remainingHours: workItems
            .filter((item) => item.status !== 'done' && item.status !== 'cancelled')
            .reduce((sum, item) => sum + item.estimateHours, 0),
        }
      })
  }

  async commitStory(params: { productId: string; storyId: string; actor?: string }): Promise<void> {
    const actor = params.actor ?? 'pm'

    await this.uow.write((db) => {
      const sprint = db.sprints.find(
        (item) => item.productId === params.productId && item.status === 'active',
      )
      if (!sprint) {
        throw new DomainError('PRECONDITION', 'No active sprint to commit into')
      }

      const story = db.userStories.find((item) => item.id === params.storyId)
      if (!story) throw new DomainError('NOT_FOUND', 'Story not found')

      const already = db.sprintAssignments.some(
        (assignment) =>
          assignment.sprintId === sprint.id &&
          assignment.targetType === 'user_story' &&
          assignment.targetId === story.id,
      )
      if (already) return

      const otherActive = db.sprintAssignments.find((assignment) => {
        if (assignment.targetType !== 'user_story' || assignment.targetId !== story.id) return false
        const assignedSprint = db.sprints.find((item) => item.id === assignment.sprintId)
        return assignedSprint?.status === 'active' && assignedSprint.id !== sprint.id
      })
      if (otherActive) {
        throw new DomainError('INVARIANT', 'Story already committed to another active sprint')
      }

      const assignment: SprintAssignment = {
        id: createId(),
        sprintId: sprint.id,
        targetType: 'user_story',
        targetId: story.id,
        committedAt: new Date().toISOString(),
        committedBy: actor,
      }
      db.sprintAssignments.push(assignment)

      if (story.status === StoryStatus.Draft || story.status === StoryStatus.Refining || story.status === StoryStatus.Ready) {
        story.status = StoryStatus.Planned
        story.updatedAt = new Date().toISOString()
        story.updatedBy = actor
      }

      const storyWork = db.workItems.filter((item) => item.userStoryId === story.id)
      const storyDeps = db.dependencies.filter(
        (dep) =>
          storyWork.some((item) => item.id === dep.fromId) ||
          storyWork.some((item) => item.id === dep.toId),
      )

      const scheduled = scheduleWorkItems({
        workItems: storyWork,
        dependencies: storyDeps,
        projectStart: sprint.startDate,
      })

      for (const scheduledItem of scheduled) {
        const target = db.workItems.find((item) => item.id === scheduledItem.id)
        if (!target) continue
        target.sprintId = sprint.id
        target.forecastStart = scheduledItem.forecastStart
        target.forecastEnd = scheduledItem.forecastEnd
        target.updatedAt = new Date().toISOString()
        target.updatedBy = actor
      }

      db.events.push({
        id: createId(),
        productId: params.productId as WorkItem['productId'],
        type: 'StoryCommittedToSprint',
        aggregateType: 'user_story',
        aggregateId: story.id,
        occurredAt: new Date().toISOString(),
        actor,
        payload: { sprintId: sprint.id, storyKey: story.key },
      })
    })

    logger.info('Story committed to sprint', { storyId: params.storyId }, 'sprint')
  }

  async uncommitStory(params: { productId: string; storyId: string; actor?: string }): Promise<void> {
    const actor = params.actor ?? 'pm'
    await this.uow.write((db) => {
      const sprint = db.sprints.find(
        (item) => item.productId === params.productId && item.status === 'active',
      )
      if (!sprint) return

      db.sprintAssignments = db.sprintAssignments.filter(
        (assignment) =>
          !(
            assignment.sprintId === sprint.id &&
            assignment.targetType === 'user_story' &&
            assignment.targetId === params.storyId
          ),
      )

      for (const item of db.workItems) {
        if (item.userStoryId === params.storyId && item.sprintId === sprint.id) {
          item.sprintId = undefined
          item.updatedAt = new Date().toISOString()
          item.updatedBy = actor
        }
      }

      const story = db.userStories.find((item) => item.id === params.storyId)
      if (story && story.status === StoryStatus.Planned) {
        story.status = StoryStatus.Ready
        story.updatedAt = new Date().toISOString()
        story.updatedBy = actor
      }
    })

    logger.info('Story uncommitted from sprint', { storyId: params.storyId }, 'sprint')
  }
}
