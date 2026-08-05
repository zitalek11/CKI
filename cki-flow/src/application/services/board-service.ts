import type { UnitOfWork } from '@/application/ports/unit-of-work'
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
      if (!story) throw new DomainError('NOT_FOUND', 'Story not found')
      assertStoryTransition(story.status, params.toStatus)
      const from = story.status
      story.status = params.toStatus
      story.updatedAt = new Date().toISOString()
      story.updatedBy = actor
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
