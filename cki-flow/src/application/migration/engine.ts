import {
  applyMappingToDraft,
  type MappingRulesBundle,
} from '@/domain/migration/mapping'
import { summarizeDraft } from '@/domain/migration/summary'
import type {
  AnalysisSummary,
  ImportDraft,
  MigrationMode,
  MigrationSourceFormat,
  ValidationReport,
} from '@/domain/migration/types'
import { validateImportDraft } from '@/domain/migration/validate-draft'
import type { MigrationFileInput, MigrationSourceAdapter } from './ports'

export type AnalyzeResult = {
  draft: ImportDraft
  summary: AnalysisSummary
  validation: ValidationReport
  ambiguousTokens: AmbiguousToken[]
}

export type AmbiguousToken = {
  token: string
  field: 'role' | 'status' | 'work_type' | 'person' | 'column' | 'sprint' | 'quarter'
  hint: string
  storyTempId?: string
}

export class MigrationEngine {
  private readonly adapters: MigrationSourceAdapter[]

  constructor(adapters: MigrationSourceAdapter[]) {
    this.adapters = adapters
  }

  listFormats(): MigrationSourceFormat[] {
    return this.adapters.map((adapter) => adapter.format)
  }

  detectFormat(input: MigrationFileInput): MigrationSourceFormat | null {
    const matched = this.adapters.find((adapter) => adapter.canHandle(input))
    return matched?.format ?? null
  }

  adapterFor(format: MigrationSourceFormat): MigrationSourceAdapter | undefined {
    return this.adapters.find((adapter) => adapter.format === format)
  }

  async analyze(
    input: MigrationFileInput,
    options: {
      mode: MigrationMode
      mappingRules: MappingRulesBundle
      format?: MigrationSourceFormat
    },
  ): Promise<AnalyzeResult> {
    const format = options.format ?? this.detectFormat(input)
    if (!format) {
      throw new Error(
        `Не удалось определить формат файла «${input.fileName}». Поддерживаются: ${this.listFormats().join(', ')}`,
      )
    }

    const adapter = this.adapterFor(format)
    if (!adapter) {
      throw new Error(`Адаптер для источника «${format}» не подключён`)
    }

    const parsed = await adapter.parse(input)
    const draft = applyMappingToDraft(parsed, options.mappingRules)
    draft.mappingRules = options.mappingRules.rules

    return {
      draft,
      summary: summarizeDraft(draft),
      validation: validateImportDraft(draft),
      ambiguousTokens: collectAmbiguousTokens(draft),
    }
  }
}

function collectAmbiguousTokens(draft: ImportDraft): AmbiguousToken[] {
  const tokens: AmbiguousToken[] = []

  for (const story of draft.stories) {
    if (!story.status) {
      tokens.push({
        token: story.stageHints?.[0] ?? story.sourceHint ?? story.title.slice(0, 32),
        field: 'status',
        hint: 'Статус не сопоставлен',
        storyTempId: story.tempId,
      })
    }
    if (!story.ownerName && (!story.assigneeHints || story.assigneeHints.length === 0)) {
      tokens.push({
        token: story.key ?? story.title.slice(0, 32),
        field: 'person',
        hint: 'Ответственный не определён',
        storyTempId: story.tempId,
      })
    }
    for (const hint of story.assigneeHints ?? []) {
      if (!draft.people.some((person) => person.displayName === hint) && !story.ownerName) {
        tokens.push({
          token: hint,
          field: 'role',
          hint: 'Код роли/участника требует сопоставления',
          storyTempId: story.tempId,
        })
      }
    }
    if (!story.sprintName) {
      tokens.push({
        token: story.key ?? story.title.slice(0, 32),
        field: 'sprint',
        hint: 'Sprint не определён',
        storyTempId: story.tempId,
      })
    }
    if (!story.quarterKey && draft.quarters.length > 1) {
      tokens.push({
        token: story.key ?? story.title.slice(0, 32),
        field: 'quarter',
        hint: 'Квартал не определён',
        storyTempId: story.tempId,
      })
    }
    if (!story.storyType) {
      tokens.push({
        token: story.key ?? story.title.slice(0, 32),
        field: 'work_type',
        hint: 'Тип задачи не определён',
        storyTempId: story.tempId,
      })
    }
  }

  // Deduplicate by token+field
  const seen = new Set<string>()
  return tokens.filter((item) => {
    const key = `${item.field}:${item.token.toLowerCase()}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
