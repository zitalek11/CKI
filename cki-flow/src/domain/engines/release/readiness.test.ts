import { describe, expect, it } from 'vitest'
import { calculateReleaseReadiness } from '@/domain/engines/release/readiness'
import type { ReleaseMembership, UserStory, WorkItem } from '@/domain/model/entities'
import {
  ReleaseInclusion,
  StoryStatus,
  StoryType,
  WorkItemOrigin,
  WorkItemStatus,
} from '@/domain/model/enums'
import { createId } from '@/domain/model/ids'

describe('calculateReleaseReadiness', () => {
  it('fails must scope gate when story is open', () => {
    const storyId = createId()
    const now = new Date().toISOString()
    const story: UserStory = {
      id: storyId,
      productId: createId(),
      key: 'CKI-1',
      title: 'A',
      storyType: StoryType.Feature,
      status: StoryStatus.InProgress,
      interruptFlag: false,
      templateDeviation: false,
      backlogRank: 'a0',
      createdAt: now,
      updatedAt: now,
      createdBy: 't',
      updatedBy: 't',
    }
    const memberships: ReleaseMembership[] = [
      {
        id: createId(),
        releaseId: createId(),
        userStoryId: storyId,
        inclusion: ReleaseInclusion.Must,
        waived: false,
      },
    ]
    const workItems: WorkItem[] = [
      {
        id: createId(),
        productId: story.productId,
        userStoryId: storyId,
        key: 'CKI-1-QA',
        title: 'QA',
        workTypeId: createId(),
        requiredRoleSkillId: createId(),
        status: WorkItemStatus.Planned,
        origin: WorkItemOrigin.Template,
        workflowStageKey: 'QA',
        isMandatory: true,
        estimateHours: 4,
        spentHours: 0,
        createdAt: now,
        updatedAt: now,
        createdBy: 't',
        updatedBy: 't',
      },
    ]

    const result = calculateReleaseReadiness({ memberships, stories: [story], workItems })
    expect(result.gates.find((gate) => gate.key === 'G_SCOPE')?.passed).toBe(false)
    expect(result.gates.find((gate) => gate.key === 'G_QUALITY')?.passed).toBe(false)
    expect(result.readinessPercent).toBeLessThan(100)
  })
})
