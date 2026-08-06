import type { MigrationFileInput, MigrationSourceAdapter } from '@/application/migration/ports'
import type {
  Confidence,
  DraftDependency,
  DraftEpic,
  DraftInitiative,
  DraftPerson,
  DraftQuarter,
  DraftRelease,
  DraftSprint,
  DraftStory,
  ImportDraft,
} from '@/domain/migration/types'
import { StoryStatus, StoryType } from '@/domain/model/enums'

type BoardJson = {
  format?: string
  formatVersion?: number
  people?: Array<Partial<DraftPerson> & { displayName: string }>
  quarters?: Array<Partial<DraftQuarter> & { key: string; year: number; index: 1 | 2 | 3 | 4 }>
  sprints?: Array<Partial<DraftSprint> & { name: string }>
  initiatives?: Array<Partial<DraftInitiative> & { key: string; title: string }>
  epics?: Array<Partial<DraftEpic> & { key: string; title: string }>
  stories?: Array<Partial<DraftStory> & { title: string }>
  dependencies?: Array<Partial<DraftDependency>>
  releases?: Array<Partial<DraftRelease> & { key: string; name: string }>
  notes?: string[]
}

function tempId(): string {
  return crypto.randomUUID()
}

function withRef<T extends object>(
  item: T,
  confidence: Confidence = 'high',
): T & { tempId: string; confidence: Confidence } {
  return { tempId: tempId(), confidence, ...item }
}

export class JsonBoardAdapter implements MigrationSourceAdapter {
  readonly format = 'json' as const

  canHandle(input: MigrationFileInput): boolean {
    const name = input.fileName.toLowerCase()
    return name.endsWith('.json') || input.mimeType.includes('json')
  }

  async parse(input: MigrationFileInput): Promise<ImportDraft> {
    const text = new TextDecoder().decode(input.bytes)
    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      throw new Error('Файл не является валидным JSON')
    }

    const board = parsed as BoardJson
    if (board.format === 'cki-flow-db') {
      throw new Error(
        'Это полный экспорт базы CKI Flow. Используйте Settings → Import JSON. Migration Wizard ожидает формат cki-board-export.',
      )
    }

    if (board.format && board.format !== 'cki-board-export') {
      throw new Error(`Неизвестный JSON-формат: ${board.format}`)
    }

    const people = (board.people ?? []).map((person) =>
      withRef({
        displayName: person.displayName,
        roleHint: person.roleHint,
        email: person.email,
        needsReview: person.needsReview,
        reviewReason: person.reviewReason,
      }),
    )

    const quarters = (board.quarters ?? []).map((quarter) =>
      withRef({
        key: quarter.key,
        year: quarter.year,
        index: quarter.index,
        startDate: quarter.startDate ?? `${quarter.year}-01-01`,
        endDate: quarter.endDate ?? `${quarter.year}-03-31`,
      }),
    )

    const sprints = (board.sprints ?? []).map((sprint) =>
      withRef({
        name: sprint.name,
        quarterKey: sprint.quarterKey,
        startDate: sprint.startDate ?? '2026-01-01',
        endDate: sprint.endDate ?? '2026-01-14',
      }),
    )

    const initiatives = (board.initiatives ?? []).map((initiative) =>
      withRef({
        key: initiative.key,
        title: initiative.title,
        quarterKey: initiative.quarterKey,
        outcome: initiative.outcome,
      }),
    )

    const epics = (board.epics ?? []).map((epic) =>
      withRef({
        key: epic.key,
        title: epic.title,
        initiativeKey: epic.initiativeKey,
      }),
    )

    const stories = (board.stories ?? []).map((story) =>
      withRef({
        key: story.key,
        title: story.title,
        description: story.description,
        storyType: coerceStoryType(story.storyType),
        status: coerceStoryStatus(story.status),
        epicKey: story.epicKey,
        initiativeKey: story.initiativeKey,
        sprintName: story.sprintName,
        quarterKey: story.quarterKey,
        releaseKey: story.releaseKey,
        ownerName: story.ownerName,
        estimateHours: story.estimateHours,
        storyPoints: story.storyPoints,
        assigneeHints: story.assigneeHints,
        stageHints: story.stageHints,
        needsReview: story.needsReview,
        reviewReason: story.reviewReason,
        sourceHint: story.sourceHint,
      }),
    )

    const dependencies = (board.dependencies ?? []).map((dep) =>
      withRef(
        {
          fromStoryKey: dep.fromStoryKey,
          toStoryKey: dep.toStoryKey,
          fromTitle: dep.fromTitle,
          toTitle: dep.toTitle,
          kind: dep.kind ?? 'FS',
          unresolved: dep.unresolved,
          needsReview: dep.needsReview || dep.unresolved,
          reviewReason: dep.reviewReason,
        },
        dep.unresolved ? 'low' : 'medium',
      ),
    )

    const releases = (board.releases ?? []).map((release) =>
      withRef({
        key: release.key,
        name: release.name,
        versionName: release.versionName,
        plannedDate: release.plannedDate,
        storyKeys: release.storyKeys ?? [],
      }),
    )

    return {
      sourceFormat: 'json',
      sourceFileName: input.fileName,
      analyzedAt: new Date().toISOString(),
      people,
      quarters,
      sprints,
      initiatives,
      epics,
      stories,
      dependencies,
      releases,
      mappingRules: [],
      rawNotes: board.notes ?? [],
    }
  }
}

function coerceStoryType(value: unknown): StoryType | undefined {
  if (typeof value !== 'string') return undefined
  return Object.values(StoryType).includes(value as StoryType)
    ? (value as StoryType)
    : undefined
}

function coerceStoryStatus(value: unknown): StoryStatus | undefined {
  if (typeof value !== 'string') return undefined
  return Object.values(StoryStatus).includes(value as StoryStatus)
    ? (value as StoryStatus)
    : undefined
}
