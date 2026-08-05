import type { UnitOfWork } from '@/application/ports/unit-of-work'
import { calculateReleaseReadiness, type ReleaseReadiness } from '@/domain/engines/release/readiness'
import type { Release, ReleaseMembership, UserStory } from '@/domain/model/entities'
import { ReleaseInclusion, ReleaseStatus } from '@/domain/model/enums'
import { DomainError } from '@/domain/model/errors'
import { createId, type UUID } from '@/domain/model/ids'
import { touchSystemFields } from '@/domain/model/system'
import { logger } from '@/shared/lib/logger'

export type ReleaseDetails = {
  release: Release
  memberships: ReleaseMembership[]
  stories: UserStory[]
  readiness: ReleaseReadiness
  candidates: UserStory[]
}

export class ReleaseService {
  private readonly uow: UnitOfWork

  constructor(uow: UnitOfWork) {
    this.uow = uow
  }

  async list(productId: string): Promise<Release[]> {
    await this.ensureDefaultRelease(productId)
    const db = await this.uow.read()
    return db.releases.filter((item) => item.productId === productId)
  }

  async getDetails(productId: string, releaseId?: string): Promise<ReleaseDetails> {
    await this.ensureDefaultRelease(productId)
    const db = await this.uow.read()
    const release =
      (releaseId ? db.releases.find((item) => item.id === releaseId) : undefined) ??
      db.releases.find((item) => item.productId === productId && item.status !== ReleaseStatus.Cancelled)

    if (!release) {
      throw new DomainError('NOT_FOUND', 'Release not found')
    }

    const memberships = db.releaseMemberships.filter((item) => item.releaseId === release.id)
    const stories = db.userStories.filter((story) =>
      memberships.some((membership) => membership.userStoryId === story.id),
    )
    const workItems = db.workItems.filter((item) =>
      stories.some((story) => story.id === item.userStoryId),
    )
    const readiness = calculateReleaseReadiness({ memberships, stories, workItems })
    const candidates = db.userStories.filter(
      (story) =>
        story.productId === productId &&
        story.status !== 'cancelled' &&
        story.status !== 'archived' &&
        !memberships.some((membership) => membership.userStoryId === story.id),
    )

    return { release, memberships, stories, readiness, candidates }
  }

  async addStory(params: {
    releaseId: string
    storyId: string
    inclusion?: 'must' | 'should' | 'stretch'
    actor?: string
  }): Promise<void> {
    const actor = params.actor ?? 'pm'
    await this.uow.write((db) => {
      const release = db.releases.find((item) => item.id === params.releaseId)
      if (!release) throw new DomainError('NOT_FOUND', 'Release not found')
      if (release.status === ReleaseStatus.CodeFreeze || release.status === ReleaseStatus.Ready) {
        throw new DomainError('PRECONDITION', 'Release is frozen — override not implemented in MVP')
      }
      const exists = db.releaseMemberships.some(
        (item) => item.releaseId === params.releaseId && item.userStoryId === params.storyId,
      )
      if (exists) return
      db.releaseMemberships.push({
        id: createId(),
        releaseId: params.releaseId as UUID,
        userStoryId: params.storyId as UUID,
        inclusion: params.inclusion ?? ReleaseInclusion.Must,
        waived: false,
      })
      if (release.status === ReleaseStatus.Planned) {
        release.status = ReleaseStatus.InProgress
        Object.assign(release, touchSystemFields(release, actor))
      }
    })
    logger.info('Story added to release', params, 'release')
  }

  async removeStory(params: { releaseId: string; storyId: string }): Promise<void> {
    await this.uow.write((db) => {
      const release = db.releases.find((item) => item.id === params.releaseId)
      if (!release) throw new DomainError('NOT_FOUND', 'Release not found')
      if (release.status === ReleaseStatus.CodeFreeze || release.status === ReleaseStatus.Released) {
        throw new DomainError('PRECONDITION', 'Cannot remove story from frozen/released release')
      }
      db.releaseMemberships = db.releaseMemberships.filter(
        (item) => !(item.releaseId === params.releaseId && item.userStoryId === params.storyId),
      )
    })
  }

  private async ensureDefaultRelease(productId: string): Promise<Release> {
    let created: Release | undefined
    await this.uow.write((db) => {
      const existing = db.releases.find((item) => item.productId === productId)
      if (existing) {
        created = existing
        return
      }
      const system = touchSystemFields(undefined, 'system')
      created = {
        id: createId(),
        productId: productId as UUID,
        key: 'REL-2.4',
        name: 'Release 2.4',
        versionName: '2.4.0',
        status: ReleaseStatus.Planned,
        plannedDate: '2026-08-28',
        ...system,
      }
      db.releases.push(created)
    })
    if (!created) throw new DomainError('CONFLICT', 'Failed to ensure release')
    return created
  }
}
