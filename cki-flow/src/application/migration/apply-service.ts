import type { UnitOfWork } from '@/application/ports/unit-of-work'
import { scheduleWorkItems } from '@/domain/engines/planning/schedule'
import {
  applyWorkflowTemplate,
  selectWorkflowTemplateId,
} from '@/domain/engines/workflow/apply-workflow'
import { buildUpdateDiff } from '@/domain/migration/diff'
import type {
  ImportCounts,
  ImportDraft,
  ImportJournal,
  MigrationMode,
  UpdateDiffItem,
} from '@/domain/migration/types'
import type { DomainDatabase } from '@/domain/model/database'
import type { Employee, UserStory } from '@/domain/model/entities'
import {
  DependencyKind,
  DependencySource,
  DependencyStrength,
  EpicStatus,
  InitiativeStatus,
  PlanningObjectType,
  QuarterStatus,
  ReleaseInclusion,
  ReleaseStatus,
  SprintStatus,
  StoryStatus,
  StoryType,
} from '@/domain/model/enums'
import { DomainError } from '@/domain/model/errors'
import { createId, type UUID } from '@/domain/model/ids'
import { formatStoryKey, nextFractionalRank } from '@/domain/model/keys'
import { touchSystemFields } from '@/domain/model/system'
import { logger } from '@/shared/lib/logger'

const ACTOR = 'migration'

export type ApplyMigrationInput = {
  productId: UUID
  draft: ImportDraft
  mode: MigrationMode
  /** When mode=update, only apply selected diffs (key:field). Empty = apply all. */
  selectedDiffKeys?: string[]
}

export type ApplyMigrationResult = {
  journal: ImportJournal
  diffs: UpdateDiffItem[]
}

export class MigrationApplyService {
  private readonly uow: UnitOfWork

  constructor(uow: UnitOfWork) {
    this.uow = uow
  }

  previewDiffs(productId: UUID, draft: ImportDraft): Promise<UpdateDiffItem[]> {
    return this.uow.read().then((db) => buildUpdateDiff(draft, db, productId))
  }

  async apply(input: ApplyMigrationInput): Promise<ApplyMigrationResult> {
    const diffs =
      input.mode === 'update'
        ? await this.previewDiffs(input.productId, input.draft)
        : []

    const selected =
      input.selectedDiffKeys && input.selectedDiffKeys.length > 0
        ? new Set(input.selectedDiffKeys)
        : null

    const activeDiffs =
      selected === null ? diffs : diffs.filter((item) => selected.has(diffKey(item)))

    let journal: ImportJournal | undefined

    await this.uow.write((db) => {
      const product = db.products.find((item) => item.id === input.productId)
      if (!product) {
        throw new DomainError('NOT_FOUND', 'Product not found', {
          productId: input.productId,
        })
      }

      if (input.mode === 'full') {
        journal = applyFullMigration(db, product.id, input.draft)
      } else {
        journal = applyUpdateMigration(db, product.id, input.draft, activeDiffs)
      }
    })

    if (!journal) {
      throw new DomainError('CONFLICT', 'Migration did not produce a journal')
    }

    logger.info(
      'Migration applied',
      { mode: input.mode, stories: journal.imported.stories },
      'migration',
    )

    return { journal, diffs: activeDiffs }
  }
}

function diffKey(item: UpdateDiffItem): string {
  return `${item.entityType}:${item.key}:${item.field}`
}

function emptyCounts(): ImportCounts {
  return {
    initiatives: 0,
    epics: 0,
    stories: 0,
    workItems: 0,
    employees: 0,
    dependencies: 0,
    sprints: 0,
    quarters: 0,
    releases: 0,
  }
}

function clearPlanningEntities(db: DomainDatabase, productId: UUID): void {
  const storyIds = new Set(
    db.userStories.filter((item) => item.productId === productId).map((item) => item.id),
  )
  const workItemIds = new Set(
    db.workItems.filter((item) => item.productId === productId).map((item) => item.id),
  )
  const sprintIds = new Set(
    db.sprints.filter((item) => item.productId === productId).map((item) => item.id),
  )
  const releaseIds = new Set(
    db.releases.filter((item) => item.productId === productId).map((item) => item.id),
  )

  db.acceptanceCriteria = db.acceptanceCriteria.filter(
    (item) => !storyIds.has(item.userStoryId),
  )
  db.sprintAssignments = db.sprintAssignments.filter(
    (item) =>
      !sprintIds.has(item.sprintId) &&
      !(item.targetType === 'user_story' && storyIds.has(item.targetId)) &&
      !(item.targetType === 'work_item' && workItemIds.has(item.targetId)),
  )
  db.releaseMemberships = db.releaseMemberships.filter(
    (item) => !releaseIds.has(item.releaseId) && !storyIds.has(item.userStoryId),
  )
  db.dependencies = db.dependencies.filter((item) => item.productId !== productId)
  db.workItems = db.workItems.filter((item) => item.productId !== productId)
  db.userStories = db.userStories.filter((item) => item.productId !== productId)
  db.epics = db.epics.filter((item) => item.productId !== productId)
  db.initiatives = db.initiatives.filter((item) => item.productId !== productId)
  db.quarterGoals = db.quarterGoals.filter((item) => item.productId !== productId)
  db.quarters = db.quarters.filter((item) => item.productId !== productId)
  db.sprints = db.sprints.filter((item) => item.productId !== productId)
  db.releases = db.releases.filter((item) => item.productId !== productId)
  db.employeeSkills = db.employeeSkills.filter(
    (skill) => !db.employees.some((e) => e.id === skill.employeeId && e.productId === productId),
  )
  db.employees = db.employees.filter((item) => item.productId !== productId)
}

function applyFullMigration(
  db: DomainDatabase,
  productId: UUID,
  draft: ImportDraft,
): ImportJournal {
  clearPlanningEntities(db, productId)
  const product = db.products.find((item) => item.id === productId)!
  product.storySequence = 0
  product.updatedAt = new Date().toISOString()
  product.updatedBy = ACTOR

  const warnings: string[] = []
  const imported = emptyCounts()
  const now = touchSystemFields(undefined, ACTOR)
  const team = db.teams.find((item) => item.productId === productId)

  const employeeByName = new Map<string, Employee>()
  for (const person of draft.people) {
    const employee: Employee = {
      id: createId(),
      productId,
      displayName: person.displayName,
      email: person.email,
      defaultTeamId: team?.id,
      weeklyHours: 40,
      productAllocationPercent: 100,
      status: 'active',
      ...now,
    }
    db.employees.push(employee)
    employeeByName.set(person.displayName.trim().toLowerCase(), employee)
    imported.employees += 1

    if (person.roleHint) {
      const role = db.roleSkills.find(
        (item) =>
          item.productId === productId &&
          item.code.toLowerCase() === person.roleHint!.toLowerCase(),
      )
      if (role) {
        db.employeeSkills.push({
          id: createId(),
          employeeId: employee.id,
          roleSkillId: role.id,
          weight: 1,
        })
      }
    }
  }

  const quarterIdByKey = new Map<string, UUID>()
  for (const quarter of draft.quarters) {
    const id = createId()
    db.quarters.push({
      id,
      productId,
      key: quarter.key,
      year: quarter.year,
      index: quarter.index,
      startDate: quarter.startDate,
      endDate: quarter.endDate,
      status: QuarterStatus.Active,
      ...now,
    })
    quarterIdByKey.set(quarter.key, id)
    imported.quarters += 1
  }

  if (quarterIdByKey.size === 0) {
    warnings.push('Кварталы не найдены — создан черновой квартал текущего года')
    const year = new Date().getFullYear()
    const id = createId()
    const key = `${year}-Q1`
    db.quarters.push({
      id,
      productId,
      key,
      year,
      index: 1,
      startDate: `${year}-01-01`,
      endDate: `${year}-03-31`,
      status: QuarterStatus.Planning,
      ...now,
    })
    quarterIdByKey.set(key, id)
    imported.quarters += 1
  }

  const defaultQuarterId = [...quarterIdByKey.values()][0]!

  const sprintIdByName = new Map<string, UUID>()
  for (const sprint of draft.sprints) {
    const quarterId =
      (sprint.quarterKey && quarterIdByKey.get(sprint.quarterKey)) || defaultQuarterId
    const id = createId()
    db.sprints.push({
      id,
      productId,
      quarterId,
      teamId: team?.id,
      name: sprint.name,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      status: SprintStatus.Planning,
      interruptBufferPercent: 10,
      ...now,
    })
    sprintIdByName.set(sprint.name, id)
    imported.sprints += 1
  }

  const initiativeIdByKey = new Map<string, UUID>()
  for (const initiative of draft.initiatives) {
    const quarterId =
      (initiative.quarterKey && quarterIdByKey.get(initiative.quarterKey)) ||
      defaultQuarterId
    const id = createId()
    db.initiatives.push({
      id,
      productId,
      quarterId,
      key: initiative.key,
      title: initiative.title,
      outcome: initiative.outcome ?? initiative.title,
      status: InitiativeStatus.Committed,
      ...now,
    })
    initiativeIdByKey.set(initiative.key, id)
    imported.initiatives += 1
  }

  const epicIdByKey = new Map<string, UUID>()
  for (const epic of draft.epics) {
    const id = createId()
    db.epics.push({
      id,
      productId,
      initiativeId: epic.initiativeKey
        ? initiativeIdByKey.get(epic.initiativeKey)
        : undefined,
      key: epic.key,
      title: epic.title,
      status: EpicStatus.Approved,
      ...now,
    })
    epicIdByKey.set(epic.key, id)
    imported.epics += 1
  }

  const releaseIdByKey = new Map<string, UUID>()
  for (const release of draft.releases) {
    const id = createId()
    db.releases.push({
      id,
      productId,
      key: release.key,
      name: release.name,
      versionName: release.versionName ?? release.key,
      status: ReleaseStatus.Planned,
      plannedDate: release.plannedDate,
      ...now,
    })
    releaseIdByKey.set(release.key, id)
    imported.releases += 1
  }

  const storyIdByDraftKey = new Map<string, UUID>()
  let lastRank: string | undefined

  for (const draftStory of draft.stories) {
    product.storySequence += 1
    const key = draftStory.key?.trim() || formatStoryKey(product.key, product.storySequence)
    const storyType = draftStory.storyType ?? StoryType.Feature
    const templateId = selectWorkflowTemplateId({
      storyType,
      templates: db.workflowTemplates.filter((item) => item.productId === productId),
      defaultTemplateId: product.defaultWorkflowTemplateId,
    })
    const template = db.workflowTemplates.find((item) => item.id === templateId)
    const version = db.workflowTemplateVersions.find(
      (item) => item.id === template?.currentPublishedVersionId,
    )
    if (!template || !version) {
      throw new DomainError('NOT_FOUND', 'Published workflow template version not found')
    }

    const owner =
      (draftStory.ownerName &&
        employeeByName.get(draftStory.ownerName.trim().toLowerCase())) ||
      undefined

    const system = touchSystemFields(undefined, ACTOR)
    const story: UserStory = {
      id: createId(),
      productId,
      key,
      title: draftStory.title,
      description: draftStory.description,
      storyType,
      status: StoryStatus.Draft,
      epicId: draftStory.epicKey ? epicIdByKey.get(draftStory.epicKey) : undefined,
      initiativeId: draftStory.initiativeKey
        ? initiativeIdByKey.get(draftStory.initiativeKey)
        : undefined,
      teamId: team?.id,
      ownerEmployeeId: owner?.id,
      storyPoints: draftStory.storyPoints,
      interruptFlag: false,
      templateDeviation: false,
      backlogRank: nextFractionalRank(lastRank),
      ...system,
    }
    lastRank = story.backlogRank

    const applied = applyWorkflowTemplate({
      story,
      storyKey: story.key,
      templateVersion: version,
      actor: ACTOR,
    })

    const sprintId = draftStory.sprintName
      ? sprintIdByName.get(draftStory.sprintName)
      : undefined
    const projectStart =
      (sprintId && db.sprints.find((item) => item.id === sprintId)?.startDate) ||
      new Date().toISOString().slice(0, 10)

    const scheduled = scheduleWorkItems({
      workItems: applied.workItems,
      dependencies: applied.dependencies,
      projectStart,
    })

    if (sprintId) {
      for (const workItem of scheduled) {
        workItem.sprintId = sprintId
      }
      db.sprintAssignments.push({
        id: createId(),
        sprintId,
        targetType: 'user_story',
        targetId: applied.story.id,
        committedAt: system.createdAt,
        committedBy: ACTOR,
      })
    }

    // Promote story status after generation (workflow requires draft at apply time)
    if (draftStory.status && draftStory.status !== StoryStatus.Draft) {
      applied.story.status = draftStory.status
    } else {
      applied.story.status = StoryStatus.Ready
    }

    db.userStories.push(applied.story)
    db.workItems.push(...scheduled)
    db.dependencies.push(...applied.dependencies)

    storyIdByDraftKey.set(draftStory.key ?? draftStory.tempId, applied.story.id)
    storyIdByDraftKey.set(draftStory.tempId, applied.story.id)
    storyIdByDraftKey.set(key, applied.story.id)

    imported.stories += 1
    imported.workItems += scheduled.length
    imported.dependencies += applied.dependencies.length

    if (!owner) {
      warnings.push(`Задача «${draftStory.title}» требует назначения исполнителя`)
    }

    if (draftStory.releaseKey) {
      const releaseId = releaseIdByKey.get(draftStory.releaseKey)
      if (releaseId) {
        db.releaseMemberships.push({
          id: createId(),
          releaseId,
          userStoryId: applied.story.id,
          inclusion: ReleaseInclusion.Must,
          waived: false,
        })
      }
    }
  }

  for (const release of draft.releases) {
    const releaseId = releaseIdByKey.get(release.key)
    if (!releaseId) continue
    for (const storyKey of release.storyKeys) {
      const storyId = storyIdByDraftKey.get(storyKey)
      if (!storyId) continue
      const exists = db.releaseMemberships.some(
        (item) => item.releaseId === releaseId && item.userStoryId === storyId,
      )
      if (!exists) {
        db.releaseMemberships.push({
          id: createId(),
          releaseId,
          userStoryId: storyId,
          inclusion: ReleaseInclusion.Should,
          waived: false,
        })
      }
    }
  }

  for (const dep of draft.dependencies) {
    if (dep.unresolved) {
      warnings.push(dep.reviewReason ?? 'Зависимость не удалось определить автоматически')
      continue
    }
    const fromKey = dep.fromStoryKey
    const toKey = dep.toStoryKey
    const fromId = fromKey ? storyIdByDraftKey.get(fromKey) : undefined
    const toId = toKey ? storyIdByDraftKey.get(toKey) : undefined
    if (!fromId || !toId) {
      warnings.push(
        dep.reviewReason ??
          `Зависимость требует подтверждения: ${dep.fromTitle ?? fromKey} → ${dep.toTitle ?? toKey}`,
      )
      continue
    }
    db.dependencies.push({
      id: createId(),
      productId,
      fromType: PlanningObjectType.UserStory,
      fromId,
      toType: PlanningObjectType.UserStory,
      toId,
      kind: dep.kind ?? DependencyKind.FS,
      strength: DependencyStrength.Hard,
      lagDays: 0,
      reason: 'Imported from board',
      source: DependencySource.Inferred,
      ...now,
    })
    imported.dependencies += 1
  }

  db.events.push({
    id: createId(),
    productId,
    type: 'MigrationCompleted',
    aggregateType: 'product',
    aggregateId: productId,
    occurredAt: new Date().toISOString(),
    actor: ACTOR,
    payload: { mode: 'full', imported },
  })

  return {
    mode: 'full',
    completedAt: new Date().toISOString(),
    imported,
    updated: {},
    warnings: unique(warnings),
    skipped: [],
  }
}

function applyUpdateMigration(
  db: DomainDatabase,
  productId: UUID,
  draft: ImportDraft,
  diffs: UpdateDiffItem[],
): ImportJournal {
  const imported = emptyCounts()
  const updated = emptyCounts()
  const warnings: string[] = []
  const skipped: string[] = []
  const now = touchSystemFields(undefined, ACTOR)
  const product = db.products.find((item) => item.id === productId)!
  const team = db.teams.find((item) => item.productId === productId)

  const allowed = new Set(diffs.map(diffKey))
  const wants = (entityType: UpdateDiffItem['entityType'], key: string, field: string) =>
    allowed.has(`${entityType}:${key}:${field}`)

  for (const person of draft.people) {
    if (!wants('employee', person.displayName, 'exists')) continue
    const exists = db.employees.some(
      (item) =>
        item.productId === productId &&
        item.displayName.trim().toLowerCase() === person.displayName.trim().toLowerCase(),
    )
    if (exists) continue
    db.employees.push({
      id: createId(),
      productId,
      displayName: person.displayName,
      email: person.email,
      defaultTeamId: team?.id,
      weeklyHours: 40,
      productAllocationPercent: 100,
      status: 'active',
      ...now,
    })
    imported.employees += 1
  }

  const quarterId =
    db.quarters.find((item) => item.productId === productId)?.id ??
    (() => {
      const id = createId()
      const year = new Date().getFullYear()
      db.quarters.push({
        id,
        productId,
        key: `${year}-Q1`,
        year,
        index: 1,
        startDate: `${year}-01-01`,
        endDate: `${year}-03-31`,
        status: QuarterStatus.Planning,
        ...now,
      })
      return id
    })()

  for (const sprint of draft.sprints) {
    if (!wants('sprint', sprint.name, 'exists')) continue
    db.sprints.push({
      id: createId(),
      productId,
      quarterId,
      teamId: team?.id,
      name: sprint.name,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      status: SprintStatus.Planning,
      interruptBufferPercent: 10,
      ...now,
    })
    imported.sprints += 1
  }

  const initiativeIdByKey = new Map(
    db.initiatives
      .filter((item) => item.productId === productId)
      .map((item) => [item.key, item.id] as const),
  )

  for (const epic of draft.epics) {
    if (!wants('epic', epic.key, 'exists')) continue
    db.epics.push({
      id: createId(),
      productId,
      initiativeId: epic.initiativeKey
        ? initiativeIdByKey.get(epic.initiativeKey)
        : undefined,
      key: epic.key,
      title: epic.title,
      status: EpicStatus.Approved,
      ...now,
    })
    imported.epics += 1
  }

  const epicIdByKey = new Map(
    db.epics
      .filter((item) => item.productId === productId)
      .map((item) => [item.key, item.id] as const),
  )

  for (const draftStory of draft.stories) {
    const key = draftStory.key ?? draftStory.title
    const existing = db.userStories.find(
      (item) =>
        item.productId === productId &&
        (item.key === draftStory.key ||
          item.title.trim().toLowerCase() === draftStory.title.trim().toLowerCase()),
    )

    if (!existing) {
      if (!wants('user_story', key, 'exists')) {
        skipped.push(`Пропущена новая story: ${draftStory.title}`)
        continue
      }

      product.storySequence += 1
      const storyKey = draftStory.key?.trim() || formatStoryKey(product.key, product.storySequence)
      const storyType = draftStory.storyType ?? StoryType.Feature
      const templateId = selectWorkflowTemplateId({
        storyType,
        templates: db.workflowTemplates.filter((item) => item.productId === productId),
        defaultTemplateId: product.defaultWorkflowTemplateId,
      })
      const template = db.workflowTemplates.find((item) => item.id === templateId)
      const version = db.workflowTemplateVersions.find(
        (item) => item.id === template?.currentPublishedVersionId,
      )
      if (!template || !version) {
        throw new DomainError('NOT_FOUND', 'Published workflow template version not found')
      }

      const lastRank = db.userStories
        .filter((item) => item.productId === productId)
        .map((item) => item.backlogRank)
        .sort()
        .at(-1)

      const system = touchSystemFields(undefined, ACTOR)
      const story: UserStory = {
        id: createId(),
        productId,
        key: storyKey,
        title: draftStory.title,
        description: draftStory.description,
        storyType,
        status: StoryStatus.Draft,
        epicId: draftStory.epicKey ? epicIdByKey.get(draftStory.epicKey) : undefined,
        initiativeId: draftStory.initiativeKey
          ? initiativeIdByKey.get(draftStory.initiativeKey)
          : undefined,
        teamId: team?.id,
        storyPoints: draftStory.storyPoints,
        interruptFlag: false,
        templateDeviation: false,
        backlogRank: nextFractionalRank(lastRank),
        ...system,
      }

      const applied = applyWorkflowTemplate({
        story,
        storyKey: story.key,
        templateVersion: version,
        actor: ACTOR,
      })
      applied.story.status = draftStory.status ?? StoryStatus.Ready

      const scheduled = scheduleWorkItems({
        workItems: applied.workItems,
        dependencies: applied.dependencies,
        projectStart: new Date().toISOString().slice(0, 10),
      })

      db.userStories.push(applied.story)
      db.workItems.push(...scheduled)
      db.dependencies.push(...applied.dependencies)
      imported.stories += 1
      imported.workItems += scheduled.length
      imported.dependencies += applied.dependencies.length
      continue
    }

    if (wants('user_story', existing.key, 'status') && draftStory.status) {
      existing.status = draftStory.status
      existing.updatedAt = now.updatedAt
      existing.updatedBy = ACTOR
      updated.stories += 1
    }
    if (wants('user_story', existing.key, 'title')) {
      existing.title = draftStory.title
      existing.updatedAt = now.updatedAt
      existing.updatedBy = ACTOR
      updated.stories += 1
    }
    if (
      wants('user_story', existing.key, 'storyPoints') &&
      draftStory.storyPoints !== undefined
    ) {
      existing.storyPoints = draftStory.storyPoints
      existing.updatedAt = now.updatedAt
      existing.updatedBy = ACTOR
      updated.stories += 1
    }
  }

  for (const dep of draft.dependencies) {
    if (dep.unresolved || !dep.fromStoryKey || !dep.toStoryKey) {
      warnings.push(dep.reviewReason ?? 'Зависимость требует подтверждения')
    }
  }

  return {
    mode: 'update',
    completedAt: new Date().toISOString(),
    imported,
    updated,
    warnings: unique(warnings),
    skipped,
  }
}

function unique(items: string[]): string[] {
  return [...new Set(items)]
}
