import type { UnitOfWork } from '@/application/ports/unit-of-work'
import type { DomainDatabase } from '@/domain/model/database'
import { scheduleWorkItems } from '@/domain/engines/planning/schedule'
import type { Sprint, SprintAssignment, UserStory, WorkItem } from '@/domain/model/entities'
import { SprintStatus, StoryStatus } from '@/domain/model/enums'
import { DomainError } from '@/domain/model/errors'
import { createId } from '@/domain/model/ids'
import { calculateStoryProgress } from '@/domain/rules/progress'
import { touchSystemFields } from '@/domain/model/system'
import { logger } from '@/shared/lib/logger'

export type SprintBoardItem = {
  story: UserStory
  progress: number
  workItemCount: number
  remainingHours: number
  forecastStart?: string
  forecastEnd?: string
}

export type CreateSprintInput = {
  productId: string
  quarterId: string
  name: string
  startDate: string
  endDate: string
  teamId?: string
  interruptBufferPercent?: number
  goal?: string
  actor?: string
}

function resolveActiveSprint(db: DomainDatabase, productId: string): Sprint | undefined {
  const product = db.products.find((item) => item.id === productId)
  if (product?.activeSprintId) {
    const bySetting = db.sprints.find((item) => item.id === product.activeSprintId)
    if (bySetting) return bySetting
  }
  return db.sprints.find((sprint) => sprint.productId === productId && sprint.status === 'active')
}

export class SprintService {
  private readonly uow: UnitOfWork

  constructor(uow: UnitOfWork) {
    this.uow = uow
  }

  async getActiveSprint(productId: string): Promise<Sprint | undefined> {
    const db = await this.uow.read()
    return resolveActiveSprint(db, productId)
  }

  async listAll(productId: string): Promise<Sprint[]> {
    const db = await this.uow.read()
    return db.sprints
      .filter((item) => item.productId === productId)
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
  }

  async create(input: CreateSprintInput): Promise<Sprint> {
    const actor = input.actor ?? 'pm'
    const name = input.name.trim()
    if (!name) throw new DomainError('VALIDATION', 'Название спринта обязательно')
    if (input.endDate < input.startDate) {
      throw new DomainError('VALIDATION', 'Дата окончания спринта раньше даты начала')
    }

    let created: Sprint | undefined
    await this.uow.write((db) => {
      const quarter = db.quarters.find((item) => item.id === input.quarterId)
      if (!quarter) throw new DomainError('NOT_FOUND', 'Квартал не найден')

      const sprint: Sprint = {
        id: createId(),
        productId: input.productId as Sprint['productId'],
        quarterId: input.quarterId as Sprint['quarterId'],
        teamId: input.teamId as Sprint['teamId'],
        name,
        startDate: input.startDate,
        endDate: input.endDate,
        status: SprintStatus.Future,
        interruptBufferPercent: input.interruptBufferPercent ?? 10,
        goal: input.goal,
        ...touchSystemFields(undefined, actor),
      }
      db.sprints.push(sprint)
      created = sprint
    })

    if (!created) throw new DomainError('CONFLICT', 'Спринт не был создан')
    logger.info('Sprint created', { id: created.id, name: created.name }, 'sprint')
    return created
  }

  async activate(params: { productId: string; sprintId: string; actor?: string }): Promise<void> {
    const actor = params.actor ?? 'pm'
    await this.uow.write((db) => {
      const sprint = db.sprints.find(
        (item) => item.id === params.sprintId && item.productId === params.productId,
      )
      if (!sprint) throw new DomainError('NOT_FOUND', 'Спринт не найден')

      const product = db.products.find((item) => item.id === params.productId)
      if (!product) throw new DomainError('NOT_FOUND', 'Продукт не найден')

      for (const other of db.sprints) {
        if (other.id === sprint.id) continue
        if (other.productId !== params.productId) continue
        if (other.status === SprintStatus.Active) {
          other.status = SprintStatus.Completed
          Object.assign(other, touchSystemFields(other, actor))
        }
      }

      sprint.status = SprintStatus.Active
      Object.assign(sprint, touchSystemFields(sprint, actor))
      product.activeSprintId = sprint.id as typeof product.activeSprintId
      product.updatedAt = new Date().toISOString()
      product.updatedBy = actor

      db.events.push({
        id: createId(),
        productId: sprint.productId,
        type: 'SprintActivated',
        aggregateType: 'sprint',
        aggregateId: sprint.id,
        occurredAt: new Date().toISOString(),
        actor,
        payload: { name: sprint.name },
      })
    })
    logger.info('Sprint activated', { sprintId: params.sprintId }, 'sprint')
  }

  async close(params: { productId: string; sprintId: string; actor?: string }): Promise<void> {
    const actor = params.actor ?? 'pm'
    await this.uow.write((db) => {
      const sprint = db.sprints.find(
        (item) => item.id === params.sprintId && item.productId === params.productId,
      )
      if (!sprint) throw new DomainError('NOT_FOUND', 'Спринт не найден')

      sprint.status = SprintStatus.Completed
      Object.assign(sprint, touchSystemFields(sprint, actor))

      const product = db.products.find((item) => item.id === params.productId)
      if (product?.activeSprintId === sprint.id) {
        product.activeSprintId = undefined
        product.updatedAt = new Date().toISOString()
        product.updatedBy = actor
      }
    })
    logger.info('Sprint closed', { sprintId: params.sprintId }, 'sprint')
  }

  async archive(params: { productId: string; sprintId: string; actor?: string }): Promise<void> {
    const actor = params.actor ?? 'pm'
    await this.uow.write((db) => {
      const sprint = db.sprints.find(
        (item) => item.id === params.sprintId && item.productId === params.productId,
      )
      if (!sprint) throw new DomainError('NOT_FOUND', 'Спринт не найден')

      if (sprint.status === SprintStatus.Active) {
        sprint.status = SprintStatus.Completed
      }
      sprint.archivedAt = new Date().toISOString()
      Object.assign(sprint, touchSystemFields(sprint, actor))

      const product = db.products.find((item) => item.id === params.productId)
      if (product?.activeSprintId === sprint.id) {
        product.activeSprintId = undefined
        product.updatedAt = new Date().toISOString()
        product.updatedBy = actor
      }
    })
    logger.info('Sprint archived', { sprintId: params.sprintId }, 'sprint')
  }

  async copyFrom(params: {
    productId: string
    sourceSprintId: string
    name: string
    startDate: string
    endDate: string
    actor?: string
  }): Promise<Sprint> {
    const actor = params.actor ?? 'pm'
    let created: Sprint | undefined
    await this.uow.write((db) => {
      const source = db.sprints.find(
        (item) => item.id === params.sourceSprintId && item.productId === params.productId,
      )
      if (!source) throw new DomainError('NOT_FOUND', 'Исходный спринт не найден')
      if (params.endDate < params.startDate) {
        throw new DomainError('VALIDATION', 'Дата окончания спринта раньше даты начала')
      }

      const sprint: Sprint = {
        id: createId(),
        productId: source.productId,
        quarterId: source.quarterId,
        teamId: source.teamId,
        name: params.name.trim() || `${source.name} (копия)`,
        startDate: params.startDate,
        endDate: params.endDate,
        status: SprintStatus.Future,
        interruptBufferPercent: source.interruptBufferPercent,
        goal: source.goal,
        ...touchSystemFields(undefined, actor),
      }
      db.sprints.push(sprint)
      created = sprint
    })

    if (!created) throw new DomainError('CONFLICT', 'Спринт не был скопирован')
    return created
  }

  async carryOverIncomplete(params: {
    productId: string
    fromSprintId: string
    toSprintId: string
    actor?: string
  }): Promise<{ storiesMoved: number }> {
    const actor = params.actor ?? 'pm'
    let storiesMoved = 0

    await this.uow.write((db) => {
      const fromSprint = db.sprints.find(
        (item) => item.id === params.fromSprintId && item.productId === params.productId,
      )
      const toSprint = db.sprints.find(
        (item) => item.id === params.toSprintId && item.productId === params.productId,
      )
      if (!fromSprint) throw new DomainError('NOT_FOUND', 'Исходный спринт не найден')
      if (!toSprint) throw new DomainError('NOT_FOUND', 'Целевой спринт не найден')

      const incompleteAssignments = db.sprintAssignments.filter((assignment) => {
        if (assignment.sprintId !== fromSprint.id || assignment.targetType !== 'user_story') return false
        const story = db.userStories.find((item) => item.id === assignment.targetId)
        if (!story) return false
        return (
          story.status !== StoryStatus.Done &&
          story.status !== StoryStatus.Cancelled &&
          story.status !== StoryStatus.Archived
        )
      })

      for (const assignment of incompleteAssignments) {
        assignment.sprintId = toSprint.id
        assignment.committedAt = new Date().toISOString()
        assignment.committedBy = actor
        storiesMoved += 1

        const storyWork = db.workItems.filter(
          (item) =>
            item.userStoryId === assignment.targetId &&
            item.sprintId === fromSprint.id &&
            item.status !== 'done' &&
            item.status !== 'cancelled',
        )
        const storyDeps = db.dependencies.filter(
          (dep) =>
            storyWork.some((item) => item.id === dep.fromId) ||
            storyWork.some((item) => item.id === dep.toId),
        )
        const scheduled = scheduleWorkItems({
          workItems: storyWork,
          dependencies: storyDeps,
          projectStart: toSprint.startDate,
        })
        for (const scheduledItem of scheduled) {
          const target = db.workItems.find((item) => item.id === scheduledItem.id)
          if (!target) continue
          target.sprintId = toSprint.id
          target.forecastStart = scheduledItem.forecastStart
          target.forecastEnd = scheduledItem.forecastEnd
          target.updatedAt = new Date().toISOString()
          target.updatedBy = actor
        }
      }

      db.events.push({
        id: createId(),
        productId: fromSprint.productId,
        type: 'SprintCarryOver',
        aggregateType: 'sprint',
        aggregateId: toSprint.id,
        occurredAt: new Date().toISOString(),
        actor,
        payload: { fromSprintId: fromSprint.id, toSprintId: toSprint.id, storiesMoved },
      })
    })

    logger.info('Sprint carry-over completed', { ...params, storiesMoved }, 'sprint')
    return { storiesMoved }
  }

  async listCommitted(productId: string): Promise<SprintBoardItem[]> {
    const db = await this.uow.read()
    const sprint = resolveActiveSprint(db, productId)
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
    const sprint = resolveActiveSprint(db, productId)
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
      const sprint = resolveActiveSprint(db, params.productId)
      if (!sprint) {
        throw new DomainError('PRECONDITION', 'Нет активного спринта для добавления')
      }

      const story = db.userStories.find((item) => item.id === params.storyId)
      if (!story) throw new DomainError('NOT_FOUND', 'User Story не найдена')

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
        throw new DomainError('INVARIANT', 'User Story уже включена в другой активный спринт')
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
      const sprint = resolveActiveSprint(db, params.productId)
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
