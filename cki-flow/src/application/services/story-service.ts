import type { UnitOfWork } from '@/application/ports/unit-of-work'
import {
  applyWorkflowTemplate,
  selectWorkflowTemplateId,
} from '@/domain/engines/workflow/apply-workflow'
import type { UserStory } from '@/domain/model/entities'
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
      throw new DomainError('VALIDATION', 'Story title is required')
    }

    let createdStory: UserStory | undefined

    await this.uow.write((db) => {
      const product = db.products.find((item) => item.id === input.productId)
      if (!product) {
        throw new DomainError('NOT_FOUND', 'Product not found', { productId: input.productId })
      }

      const storyType = input.storyType ?? StoryType.Feature
      const templateId = selectWorkflowTemplateId({
        storyType,
        templates: db.workflowTemplates.filter((template) => template.productId === product.id),
        defaultTemplateId: product.defaultWorkflowTemplateId,
      })
      const template = db.workflowTemplates.find((item) => item.id === templateId)
      const version = db.workflowTemplateVersions.find(
        (item) => item.id === template?.currentPublishedVersionId,
      )
      if (!template || !version) {
        throw new DomainError('NOT_FOUND', 'Published workflow template version not found')
      }

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
        storyType,
        status: StoryStatus.Draft,
        epicId: input.epicId as UserStory['epicId'],
        initiativeId: input.initiativeId as UserStory['initiativeId'],
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

      db.userStories.push(applied.story)
      db.workItems.push(...applied.workItems)
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
      throw new DomainError('CONFLICT', 'Story was not created')
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
    if (!story) throw new DomainError('NOT_FOUND', 'User Story not found', { storyId })
    const workItems = db.workItems.filter((item) => item.userStoryId === story.id)
    const dependencies = db.dependencies.filter(
      (dep) =>
        (dep.fromType === 'work_item' && workItems.some((item) => item.id === dep.fromId)) ||
        (dep.toType === 'work_item' && workItems.some((item) => item.id === dep.toId)),
    )
    return { story, workItems, dependencies, progress: calculateStoryProgress(workItems) }
  }
}
