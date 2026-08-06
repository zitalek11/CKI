import { describe, expect, it } from 'vitest'
import { applyWorkflowTemplate } from '@/domain/engines/workflow/apply-workflow'
import {
  AssigneeRule,
  CreationPolicy,
  DependencyKind,
  DependencyStrength,
  StoryStatus,
  StoryType,
  TemplateVersionState,
  WorkItemStatus,
} from '@/domain/model/enums'
import { createId } from '@/domain/model/ids'
import type { UserStory, WorkflowTemplateVersion } from '@/domain/model/entities'
import { DomainError } from '@/domain/model/errors'

function makeStory(): UserStory {
  const now = new Date().toISOString()
  return {
    id: createId(),
    productId: createId(),
    key: 'CKI-1',
    title: 'Export API',
    storyType: StoryType.Feature,
    status: StoryStatus.Draft,
    interruptFlag: false,
    templateDeviation: false,
    backlogRank: 'a0',
    createdAt: now,
    updatedAt: now,
    createdBy: 'pm',
    updatedBy: 'pm',
  }
}

function makeApiVersion(): WorkflowTemplateVersion {
  const ba = createId()
  const sa = createId()
  const be = createId()
  const now = new Date().toISOString()
  return {
    id: createId(),
    workflowTemplateId: createId(),
    versionNumber: 1,
    state: TemplateVersionState.Published,
    creationPolicy: CreationPolicy.Hybrid,
    stages: [
      {
        id: createId(),
        key: 'BA',
        name: 'Business Analysis',
        workTypeId: ba,
        requiredRoleSkillId: ba,
        defaultEstimateHours: 8,
        isMandatory: true,
        assigneeRule: AssigneeRule.Unassigned,
        sortHint: 1,
      },
      {
        id: createId(),
        key: 'SA',
        name: 'System Analysis',
        workTypeId: sa,
        requiredRoleSkillId: sa,
        defaultEstimateHours: 12,
        isMandatory: true,
        assigneeRule: AssigneeRule.Unassigned,
        sortHint: 2,
      },
      {
        id: createId(),
        key: 'BE',
        name: 'Backend',
        workTypeId: be,
        requiredRoleSkillId: be,
        defaultEstimateHours: 16,
        isMandatory: true,
        assigneeRule: AssigneeRule.Unassigned,
        sortHint: 3,
      },
      {
        id: createId(),
        key: 'SPIKE_OPT',
        name: 'Optional Spike',
        workTypeId: sa,
        requiredRoleSkillId: sa,
        defaultEstimateHours: 4,
        isMandatory: false,
        assigneeRule: AssigneeRule.Unassigned,
        sortHint: 4,
      },
    ],
    dependencyRules: [
      {
        id: createId(),
        fromStageKey: 'BA',
        toStageKey: 'SA',
        kind: DependencyKind.FS,
        strength: DependencyStrength.Hard,
        lagDays: 0,
      },
      {
        id: createId(),
        fromStageKey: 'SA',
        toStageKey: 'BE',
        kind: DependencyKind.FS,
        strength: DependencyStrength.Hard,
        lagDays: 0,
      },
    ],
    createdAt: now,
    updatedAt: now,
    createdBy: 'system',
    updatedBy: 'system',
    publishedAt: now,
  }
}

describe('applyWorkflowTemplate', () => {
  it('creates mandatory stages for hybrid policy and builds dependencies', () => {
    const story = makeStory()
    const version = makeApiVersion()
    const result = applyWorkflowTemplate({
      story,
      storyKey: story.key,
      templateVersion: version,
      actor: 'pm',
    })

    expect(result.workItems).toHaveLength(3)
    expect(result.workItems.map((item) => item.workflowStageKey)).toEqual(['BA', 'SA', 'BE'])
    expect(result.workItems.every((item) => item.status === WorkItemStatus.Planned)).toBe(true)
    expect(result.dependencies).toHaveLength(2)
    expect(result.story.workflowTemplateVersionId).toBe(version.id)
  })

  it('rejects apply on non-draft story', () => {
    const story = { ...makeStory(), status: StoryStatus.Ready }
    const version = makeApiVersion()
    expect(() =>
      applyWorkflowTemplate({
        story,
        storyKey: story.key,
        templateVersion: version,
        actor: 'pm',
      }),
    ).toThrow(DomainError)
  })
})
