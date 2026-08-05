import type { UnitOfWork } from '@/application/ports/unit-of-work'
import { scheduleWorkItems } from '@/domain/engines/planning/schedule'
import {
  applyWorkflowTemplate,
  selectWorkflowTemplateId,
} from '@/domain/engines/workflow/apply-workflow'
import type {
  AcceptanceCriterion,
  Comment,
  DefinitionOfDoneItem,
  StoryPriority,
  UserStory,
} from '@/domain/model/entities'
import { StoryStatus, StoryType } from '@/domain/model/enums'
import { DomainError } from '@/domain/model/errors'
import { createId } from '@/domain/model/ids'
import { formatStoryKey, nextFractionalRank } from '@/domain/model/keys'
import { calculateStoryProgress } from '@/domain/rules/progress'
import { touchSystemFields } from '@/domain/model/system'
import { logger } from '@/shared/lib/logger'

export type CreateStoryInput = {
  productId: string
  title: string
  storyType?: StoryType
  epicId?: string
  initiativeId?: string
  description?: string
  asA?: string
  iWant?: string
  soThat?: string
  priority?: StoryPriority
  workflowTemplateId?: string
  estimationTemplateId?: string
  targetSprintId?: string
  targetQuarterId?: string
  targetReleaseId?: string
  actor?: string
}

export type StoryListItem = UserStory & {
  progress: number
  workItemCount: number
  remainingHours: number
}

export class StoryService {
  private readonly uow: UnitOfWork

  constructor(uow: UnitOfWork) {
    this.uow = uow
  }

  async listByProduct(productId: string): Promise<StoryListItem[]> {
    const db = await this.uow.read()
    return db.userStories
      .filter((story) => story.productId === productId && story.status !== StoryStatus.Archived)
      .map((story) => {
        const workItems = db.workItems.filter((item) => item.userStoryId === story.id)
        return {
          ...story,
          progress: calculateStoryProgress(workItems),
          workItemCount: workItems.length,
          remainingHours: workItems
            .filter((item) => item.status !== 'done' && item.status !== 'cancelled')
            .reduce((sum, item) => sum + item.estimateHours, 0),
        }
      })
      .sort((a, b) => a.backlogRank.localeCompare(b.backlogRank))
  }

  async create(input: CreateStoryInput): Promise<UserStory> {
    const actor = input.actor ?? 'pm'
    const title = input.title.trim()
    if (!title) {
      throw new DomainError('VALIDATION', 'Название User Story обязательно')
    }

    let createdStory: UserStory | undefined

    await this.uow.write((db) => {
      const product = db.products.find((item) => item.id === input.productId)
      if (!product) {
        throw new DomainError('NOT_FOUND', 'Продукт не найден', { productId: input.productId })
      }

      const storyType = input.storyType ?? StoryType.Feature
      const templateId =
        input.workflowTemplateId ??
        selectWorkflowTemplateId({
          storyType,
          templates: db.workflowTemplates.filter((template) => template.productId === product.id),
          defaultTemplateId: product.defaultWorkflowTemplateId,
        })
      const template = db.workflowTemplates.find((item) => item.id === templateId)
      const version = db.workflowTemplateVersions.find(
        (item) => item.id === template?.currentPublishedVersionId,
      )
      if (!template || !version) {
        throw new DomainError('NOT_FOUND', 'Не найдена опубликованная версия шаблона процесса')
      }

      const estimationTemplateId = input.estimationTemplateId ?? product.defaultEstimationTemplateId
      const estimationTemplate = estimationTemplateId
        ? db.estimationTemplates.find((item) => item.id === estimationTemplateId)
        : undefined

      product.storySequence += 1
      product.updatedAt = new Date().toISOString()
      product.updatedBy = actor

      const lastRank = db.userStories
        .filter((story) => story.productId === product.id)
        .map((story) => story.backlogRank)
        .sort()
        .at(-1)

      const system = touchSystemFields(undefined, actor)
      const story: UserStory = {
        id: createId(),
        productId: product.id,
        key: formatStoryKey(product.key, product.storySequence),
        title,
        description: input.description,
        asA: input.asA,
        iWant: input.iWant,
        soThat: input.soThat,
        storyType,
        status: StoryStatus.Draft,
        priority: input.priority ?? 'medium',
        epicId: input.epicId as UserStory['epicId'],
        initiativeId: input.initiativeId as UserStory['initiativeId'],
        estimationTemplateId: estimationTemplateId as UserStory['estimationTemplateId'],
        targetSprintId: input.targetSprintId as UserStory['targetSprintId'],
        targetQuarterId: input.targetQuarterId as UserStory['targetQuarterId'],
        targetReleaseId: input.targetReleaseId as UserStory['targetReleaseId'],
        interruptFlag: false,
        templateDeviation: false,
        backlogRank: nextFractionalRank(lastRank),
        ...system,
      }

      const applied = applyWorkflowTemplate({
        story,
        storyKey: story.key,
        templateVersion: version,
        actor,
      })

      if (estimationTemplate) {
        for (const workItem of applied.workItems) {
          const line = estimationTemplate.lines.find(
            (item) => item.stageKey === workItem.workflowStageKey,
          )
          if (line) workItem.estimateHours = line.estimateHours
        }
      }

      const targetSprint = input.targetSprintId
        ? db.sprints.find((item) => item.id === input.targetSprintId)
        : db.sprints.find((item) => item.productId === product.id && item.status === 'active')
      const scheduled = scheduleWorkItems({
        workItems: applied.workItems,
        dependencies: applied.dependencies,
        projectStart: targetSprint?.startDate ?? new Date().toISOString().slice(0, 10),
      })

      db.userStories.push(applied.story)
      db.workItems.push(...scheduled)
      db.dependencies.push(...applied.dependencies)

      db.events.push({
        id: createId(),
        productId: product.id,
        type: 'UserStoryCreated',
        aggregateType: 'user_story',
        aggregateId: applied.story.id,
        occurredAt: system.createdAt,
        actor,
        payload: {
          key: applied.story.key,
          workItemCount: applied.workItems.length,
          dependencyCount: applied.dependencies.length,
          templateCode: template.code,
          templateVersion: version.versionNumber,
        },
      })

      createdStory = applied.story
    })

    if (!createdStory) {
      throw new DomainError('CONFLICT', 'User Story не была создана')
    }

    logger.info(
      'User Story created with generated work items',
      { key: createdStory.key, id: createdStory.id },
      'story',
    )
    logger.info(
      'Work items generated from workflow template',
      { storyKey: createdStory.key },
      'workflow',
    )

    return createdStory
  }

  async getById(storyId: string) {
    const db = await this.uow.read()
    const story = db.userStories.find((item) => item.id === storyId)
    if (!story) throw new DomainError('NOT_FOUND', 'User Story не найдена', { storyId })
    const workItems = db.workItems.filter((item) => item.userStoryId === story.id)
    const dependencies = db.dependencies.filter(
      (dep) =>
        (dep.fromType === 'work_item' && workItems.some((item) => item.id === dep.fromId)) ||
        (dep.toType === 'work_item' && workItems.some((item) => item.id === dep.toId)),
    )
    const acceptanceCriteria = db.acceptanceCriteria
      .filter((item) => item.userStoryId === story.id)
      .sort((a, b) => a.sortOrder - b.sortOrder)
    const definitionOfDoneItems = db.definitionOfDoneItems
      .filter((item) => item.userStoryId === story.id)
      .sort((a, b) => a.sortOrder - b.sortOrder)
    const comments = db.comments
      .filter((item) => item.targetType === 'user_story' && item.targetId === story.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))

    return {
      story,
      workItems,
      dependencies,
      acceptanceCriteria,
      definitionOfDoneItems,
      comments,
      progress: calculateStoryProgress(workItems),
    }
  }

  async addAcceptanceCriterion(params: {
    storyId: string
    text: string
    actor?: string
  }): Promise<AcceptanceCriterion> {
    const actor = params.actor ?? 'pm'
    const text = params.text.trim()
    if (!text) throw new DomainError('VALIDATION', 'Текст критерия приёмки обязателен')

    let created: AcceptanceCriterion | undefined
    await this.uow.write((db) => {
      const story = db.userStories.find((item) => item.id === params.storyId)
      if (!story) throw new DomainError('NOT_FOUND', 'User Story не найдена')
      const sortOrder = db.acceptanceCriteria.filter((item) => item.userStoryId === story.id).length
      const criterion: AcceptanceCriterion = {
        id: createId(),
        userStoryId: story.id,
        text,
        sortOrder,
        isSatisfied: false,
        ...touchSystemFields(undefined, actor),
      }
      db.acceptanceCriteria.push(criterion)
      created = criterion
    })

    if (!created) throw new DomainError('CONFLICT', 'Критерий приёмки не был добавлен')
    return created
  }

  async toggleAcceptanceCriterion(params: { criterionId: string; actor?: string }): Promise<void> {
    const actor = params.actor ?? 'pm'
    await this.uow.write((db) => {
      const criterion = db.acceptanceCriteria.find((item) => item.id === params.criterionId)
      if (!criterion) throw new DomainError('NOT_FOUND', 'Критерий приёмки не найден')
      criterion.isSatisfied = !criterion.isSatisfied
      Object.assign(criterion, touchSystemFields(criterion, actor))
    })
  }

  async addDefinitionOfDoneItem(params: {
    storyId: string
    text: string
    actor?: string
  }): Promise<DefinitionOfDoneItem> {
    const actor = params.actor ?? 'pm'
    const text = params.text.trim()
    if (!text) throw new DomainError('VALIDATION', 'Текст пункта Definition of Done обязателен')

    let created: DefinitionOfDoneItem | undefined
    await this.uow.write((db) => {
      const story = db.userStories.find((item) => item.id === params.storyId)
      if (!story) throw new DomainError('NOT_FOUND', 'User Story не найдена')
      const sortOrder = db.definitionOfDoneItems.filter((item) => item.userStoryId === story.id).length
      const item: DefinitionOfDoneItem = {
        id: createId(),
        userStoryId: story.id,
        text,
        sortOrder,
        isSatisfied: false,
        ...touchSystemFields(undefined, actor),
      }
      db.definitionOfDoneItems.push(item)
      created = item
    })

    if (!created) throw new DomainError('CONFLICT', 'Пункт Definition of Done не был добавлен')
    return created
  }

  async toggleDefinitionOfDoneItem(params: { itemId: string; actor?: string }): Promise<void> {
    const actor = params.actor ?? 'pm'
    await this.uow.write((db) => {
      const item = db.definitionOfDoneItems.find((entry) => entry.id === params.itemId)
      if (!item) throw new DomainError('NOT_FOUND', 'Пункт Definition of Done не найден')
      item.isSatisfied = !item.isSatisfied
      Object.assign(item, touchSystemFields(item, actor))
    })
  }

  async addComment(params: {
    productId: string
    storyId: string
    body: string
    author?: string
  }): Promise<Comment> {
    const author = params.author ?? 'pm'
    const body = params.body.trim()
    if (!body) throw new DomainError('VALIDATION', 'Текст комментария обязателен')

    let created: Comment | undefined
    await this.uow.write((db) => {
      const story = db.userStories.find((item) => item.id === params.storyId)
      if (!story) throw new DomainError('NOT_FOUND', 'User Story не найдена')
      const comment: Comment = {
        id: createId(),
        productId: params.productId as Comment['productId'],
        targetType: 'user_story',
        targetId: story.id,
        body,
        author,
        ...touchSystemFields(undefined, author),
      }
      db.comments.push(comment)
      created = comment
    })

    if (!created) throw new DomainError('CONFLICT', 'Комментарий не был добавлен')
    return created
  }
}
