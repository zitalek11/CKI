import { beforeEach, describe, expect, it } from 'vitest'
import { BootstrapService } from '@/application/services/bootstrap-service'
import { SprintService } from '@/application/services/sprint-service'
import { StoryService } from '@/application/services/story-service'
import { LocalUnitOfWork } from '@/infrastructure/repositories/local-unit-of-work'
import { MemoryStorage } from '@/infrastructure/storage/memory-storage'
import { StoryType } from '@/domain/model/enums'

describe('SprintService', () => {
  let sprints: SprintService
  let stories: StoryService
  let productId: string

  beforeEach(async () => {
    const uow = new LocalUnitOfWork(new MemoryStorage())
    await new BootstrapService(uow).ensureReady({ forceSeed: true })
    sprints = new SprintService(uow)
    stories = new StoryService(uow)
    const db = await uow.read()
    productId = db.products[0]!.id
  })

  it('commits story, schedules forecasts and assigns sprint', async () => {
    const story = await stories.create({
      productId,
      title: 'Sprintable story',
      storyType: StoryType.Feature,
    })

    await sprints.commitStory({ productId, storyId: story.id })
    const committed = await sprints.listCommitted(productId)
    expect(committed).toHaveLength(1)
    expect(committed[0]?.story.key).toBe('CKI-1')
    expect(committed[0]?.forecastStart).toBeTruthy()
    expect(committed[0]?.forecastEnd).toBeTruthy()
  })
})
