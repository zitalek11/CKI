import { beforeEach, describe, expect, it } from 'vitest'
import { StoryService } from '@/application/services/story-service'
import { BootstrapService } from '@/application/services/bootstrap-service'
import { LocalUnitOfWork } from '@/infrastructure/repositories/local-unit-of-work'
import { MemoryStorage } from '@/infrastructure/storage/memory-storage'
import { StoryType } from '@/domain/model/enums'

describe('StoryService', () => {
  let stories: StoryService
  let productId: string

  beforeEach(async () => {
    const uow = new LocalUnitOfWork(new MemoryStorage())
    const bootstrap = new BootstrapService(uow)
    stories = new StoryService(uow)
    const db = await bootstrap.ensureReady({ forceSeed: true })
    productId = db.products[0]!.id
  })

  it('creates story and auto-generates work items from API template', async () => {
    const story = await stories.create({
      productId,
      title: 'Issuer ratings feed',
      storyType: StoryType.Feature,
      actor: 'pm',
    })

    expect(story.key).toBe('CKI-1')
    const details = await stories.getById(story.id)
    expect(details.workItems.length).toBe(6)
    expect(details.dependencies.length).toBe(6)
    expect(details.workItems.map((item) => item.workflowStageKey)).toEqual([
      'BA',
      'SA',
      'BE',
      'FE',
      'QA',
      'REL',
    ])
  })

  it('selects documentation template for documentation stories', async () => {
    const story = await stories.create({
      productId,
      title: 'API docs update',
      storyType: StoryType.Documentation,
    })
    const details = await stories.getById(story.id)
    expect(details.workItems).toHaveLength(3)
    expect(details.workItems.map((item) => item.workflowStageKey)).toEqual([
      'DRAFT',
      'REVIEW',
      'PUBLISH',
    ])
  })
})
