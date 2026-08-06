import type { UnitOfWork } from '@/application/ports/unit-of-work'
import { scheduleWorkItems } from '@/domain/engines/planning/schedule'
import type { UserStory } from '@/domain/model/entities'
import type { StoryStatus } from '@/domain/model/enums'
import { DomainError } from '@/domain/model/errors'
import { createId } from '@/domain/model/ids'
import { assertStoryTransition, BOARD_COLUMNS } from '@/domain/rules/story-status'
import { calculateStoryProgress } from '@/domain/rules/progress'
import { logger } from '@/shared/lib/logger'

export type BoardCard = {
  story: UserStory
  progress: number
  workItemCount: number
  remainingHours: number
}

export class BoardService {
  private readonly uow: UnitOfWork

  constructor(uow: UnitOfWork) {
    this.uow = uow
  }

  async getBoard(productId: string): Promise<Record<StoryStatus, BoardCard[]>> {
    const db = await this.uow.read()
    const columns = Object.fromEntries(BOARD_COLUMNS.map((status) => [status, [] as BoardCard[]])) as Record<
      StoryStatus,
      BoardCard[]
    >

    for (const story of db.userStories) {
      if (story.productId !== productId) continue
      if (story.status === 'cancelled' || story.status === 'archived') continue
      if (!(story.status in columns)) continue
      const workItems = db.workItems.filter((item) => item.userStoryId === story.id)
      columns[story.status as StoryStatus].push({
        story,
        progress: calculateStoryProgress(workItems),
        workItemCount: workItems.length,
        remainingHours: workItems
          .filter((item) => item.status !== 'done' && item.status !== 'cancelled')
          .reduce((sum, item) => sum + item.estimateHours, 0),
      })
    }

    return columns
  }

  async moveStory(params: {
    productId: string
    storyId: string
    toStatus: StoryStatus
    actor?: string
  }): Promise<void> {
    const actor = params.actor ?? 'pm'
    await this.uow.write((db) => {
      const story = db.userStories.find(
        (item) => item.id === params.storyId && item.productId === params.productId,
      )
      if (!story) throw new DomainError('NOT_FOUND', 'User Story не найдена')
      assertStoryTransition(story.status, params.toStatus)
      const from = story.status
      story.status = params.toStatus
      story.updatedAt = new Date().toISOString()
      story.updatedBy = actor

      const storyWork = db.workItems.filter((item) => item.userStoryId === story.id)
      if (storyWork.length > 0) {
        const storyDeps = db.dependencies.filter(
          (dep) =>
            storyWork.some((item) => item.id === dep.fromId) ||
            storyWork.some((item) => item.id === dep.toId),
        )
        const assignedSprintId = storyWork.find((item) => item.sprintId)?.sprintId
        const sprint = assignedSprintId ? db.sprints.find((item) => item.id === assignedSprintId) : undefined
        const projectStart = sprint?.startDate ?? new Date().toISOString().slice(0, 10)

        const scheduled = scheduleWorkItems({
          workItems: storyWork,
          dependencies: storyDeps,
          projectStart,
        })

        for (const scheduledItem of scheduled) {
          const target = db.workItems.find((item) => item.id === scheduledItem.id)
          if (!target) continue
          target.forecastStart = scheduledItem.forecastStart
          target.forecastEnd = scheduledItem.forecastEnd
          target.updatedAt = new Date().toISOString()
          target.updatedBy = actor
        }
      }

      db.events.push({
        id: createId(),
        productId: story.productId,
        type: 'StoryStatusChanged',
        aggregateType: 'user_story',
        aggregateId: story.id,
        occurredAt: new Date().toISOString(),
        actor,
        payload: { from, to: params.toStatus, key: story.key },
      })
    })
    logger.info('Story status changed', { storyId: params.storyId, to: params.toStatus }, 'board')
  }
}
