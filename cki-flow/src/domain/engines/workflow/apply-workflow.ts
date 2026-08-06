import { assertAcyclicHardDependencies } from '@/domain/engines/dependency/cycle'
import type {
  Dependency,
  UserStory,
  WorkItem,
  WorkflowStage,
  WorkflowTemplateVersion,
} from '@/domain/model/entities'
import {
  CreationPolicy,
  DependencySource,
  PlanningObjectType,
  WorkItemOrigin,
  WorkItemStatus,
} from '@/domain/model/enums'
import { DomainError } from '@/domain/model/errors'
import { createId, type UUID } from '@/domain/model/ids'
import { formatWorkItemKey } from '@/domain/model/keys'
import { touchSystemFields } from '@/domain/model/system'

export type ApplyWorkflowInput = {
  story: UserStory
  storyKey: string
  templateVersion: WorkflowTemplateVersion
  actor: string
  existingWorkItems?: WorkItem[]
}

export type ApplyWorkflowResult = {
  story: UserStory
  workItems: WorkItem[]
  dependencies: Dependency[]
}

function shouldCreateStage(
  stage: WorkflowStage,
  versionPolicy: CreationPolicy,
  rules: WorkflowTemplateVersion['dependencyRules'],
): boolean {
  const policy = stage.creationPolicy ?? versionPolicy

  switch (policy) {
    case CreationPolicy.Eager:
      return true
    case CreationPolicy.Manual:
      return false
    case CreationPolicy.Lazy:
    case CreationPolicy.OnPreviousDone: {
      const hasPredecessor = rules.some((rule) => rule.toStageKey === stage.key)
      return !hasPredecessor
    }
    case CreationPolicy.Hybrid:
      return stage.isMandatory
    default:
      return stage.isMandatory
  }
}

export function applyWorkflowTemplate(input: ApplyWorkflowInput): ApplyWorkflowResult {
  const { story, storyKey, templateVersion, actor } = input

  if (templateVersion.state !== 'published') {
    throw new DomainError('PRECONDITION', 'Можно применять только опубликованные версии шаблона')
  }

  if (story.status !== 'draft' && story.status !== 'refining') {
    throw new DomainError(
      'PRECONDITION',
      'Workflow can be applied only in draft or refining story status',
      { status: story.status },
    )
  }

  const inProgress = (input.existingWorkItems ?? []).some(
    (item) => item.status === WorkItemStatus.InProgress || item.status === WorkItemStatus.InReview,
  )
  if (inProgress) {
    throw new DomainError('PRECONDITION', 'Нельзя переприменить шаблон, пока есть работа в процессе')
  }

  const stagesToCreate = templateVersion.stages
    .slice()
    .sort((a, b) => a.sortHint - b.sortHint)
    .filter((stage) =>
      shouldCreateStage(stage, templateVersion.creationPolicy, templateVersion.dependencyRules),
    )

  if (stagesToCreate.length === 0) {
    throw new DomainError('VALIDATION', 'Версия шаблона не создала ни одной задачи')
  }

  const workItems: WorkItem[] = stagesToCreate.map((stage) => {
    const system = touchSystemFields(undefined, actor)
    return {
      id: createId(),
      productId: story.productId,
      userStoryId: story.id,
      key: formatWorkItemKey(storyKey, stage.key),
      title: `${stage.name}: ${story.title}`,
      description: fillTemplate(stage.descriptionTemplate, story),
      goal: fillTemplate(stage.goalTemplate, story),
      expectedResult: fillTemplate(stage.expectedResultTemplate, story),
      workTypeId: stage.workTypeId,
      requiredRoleSkillId: stage.requiredRoleSkillId,
      status: WorkItemStatus.Planned,
      origin: WorkItemOrigin.Template,
      workflowStageKey: stage.key,
      isMandatory: stage.isMandatory,
      estimateHours: stage.defaultEstimateHours,
      spentHours: 0,
      ...system,
    }
  })

  const byStageKey = new Map(
    workItems
      .filter((item) => item.workflowStageKey)
      .map((item) => [item.workflowStageKey as string, item]),
  )

  const dependencies: Dependency[] = []
  for (const rule of templateVersion.dependencyRules) {
    const from = byStageKey.get(rule.fromStageKey)
    const to = byStageKey.get(rule.toStageKey)
    if (!from || !to) continue

    const dep: Dependency = {
      id: createId(),
      productId: story.productId,
      fromType: PlanningObjectType.WorkItem,
      fromId: from.id,
      toType: PlanningObjectType.WorkItem,
      toId: to.id,
      kind: rule.kind,
      strength: rule.strength,
      lagDays: rule.lagDays,
      source: DependencySource.Template,
      reason: `Template ${templateVersion.versionNumber}: ${rule.fromStageKey} → ${rule.toStageKey}`,
      ...touchSystemFields(undefined, actor),
    }
    dependencies.push(dep)
  }

  assertAcyclicHardDependencies(dependencies)

  const updatedStory: UserStory = {
    ...story,
    workflowTemplateVersionId: templateVersion.id as UUID,
    templateDeviation: false,
    ...touchSystemFields(story, actor),
  }

  return {
    story: updatedStory,
    workItems,
    dependencies,
  }
}

export function selectWorkflowTemplateId(params: {
  storyType: UserStory['storyType']
  templates: Array<{ id: UUID; applicableStoryTypes: UserStory['storyType'][]; currentPublishedVersionId?: UUID }>
  defaultTemplateId?: UUID
}): UUID {
  const matched = params.templates.find(
    (template) =>
      Boolean(template.currentPublishedVersionId) &&
      template.applicableStoryTypes.includes(params.storyType),
  )
  if (matched) return matched.id
  if (params.defaultTemplateId) return params.defaultTemplateId
  const anyPublished = params.templates.find((template) => template.currentPublishedVersionId)
  if (anyPublished) return anyPublished.id
  throw new DomainError('NOT_FOUND', 'Нет доступного опубликованного шаблона процесса')
}

function fillTemplate(template: string | undefined, story: UserStory): string | undefined {
  if (!template?.trim()) return undefined
  return template
    .replaceAll('{{title}}', story.title)
    .replaceAll('{{key}}', story.key)
    .replaceAll('{{asA}}', story.asA ?? '')
    .replaceAll('{{iWant}}', story.iWant ?? '')
    .replaceAll('{{soThat}}', story.soThat ?? '')
}
