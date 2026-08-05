import { create } from 'zustand'
import type { AmbiguousToken, AnalyzeResult } from '@/application/migration/engine'
import { appServices } from '@/application/composition'
import type {
  ImportDraft,
  ImportJournal,
  MappingRule,
  MigrationMode,
  UpdateDiffItem,
} from '@/domain/migration/types'
import { createMappingRule } from '@/domain/migration/mapping'
import type { UUID } from '@/domain/model/ids'
import {
  loadMappingRules,
  upsertMappingRule,
} from '@/infrastructure/migration/mapping-store'

export type WizardStep =
  | 'file'
  | 'analyze'
  | 'review'
  | 'mapping'
  | 'preview'
  | 'confirm'
  | 'journal'

const STEP_ORDER: WizardStep[] = [
  'file',
  'analyze',
  'review',
  'mapping',
  'preview',
  'confirm',
  'journal',
]

type WizardState = {
  step: WizardStep
  mode: MigrationMode
  fileName: string | null
  analyzing: boolean
  applying: boolean
  error: string | null
  draft: ImportDraft | null
  summary: AnalyzeResult['summary'] | null
  validation: AnalyzeResult['validation'] | null
  ambiguous: AmbiguousToken[]
  mappingRules: MappingRule[]
  diffs: UpdateDiffItem[]
  selectedDiffKeys: string[]
  journal: ImportJournal | null
  reset: () => void
  setMode: (mode: MigrationMode) => void
  setStep: (step: WizardStep) => void
  next: () => void
  back: () => void
  analyzeFile: (file: File) => Promise<void>
  loadSample: () => Promise<void>
  updateStoryTitle: (tempId: string, title: string) => void
  removeStory: (tempId: string) => void
  resolveMapping: (token: AmbiguousToken, target: string) => void
  toggleDiff: (key: string) => void
  selectAllDiffs: () => void
  applyImport: (productId: UUID) => Promise<void>
}

const initial = {
  step: 'file' as WizardStep,
  mode: 'full' as MigrationMode,
  fileName: null as string | null,
  analyzing: false,
  applying: false,
  error: null as string | null,
  draft: null as ImportDraft | null,
  summary: null as AnalyzeResult['summary'] | null,
  validation: null as AnalyzeResult['validation'] | null,
  ambiguous: [] as AmbiguousToken[],
  mappingRules: loadMappingRules(),
  diffs: [] as UpdateDiffItem[],
  selectedDiffKeys: [] as string[],
  journal: null as ImportJournal | null,
}

export const useMigrationWizardStore = create<WizardState>((set, get) => ({
  ...initial,

  reset: () => set({ ...initial, mappingRules: loadMappingRules() }),

  setMode: (mode) => set({ mode }),

  setStep: (step) => set({ step }),

  next: () => {
    const idx = STEP_ORDER.indexOf(get().step)
    if (idx < STEP_ORDER.length - 1) set({ step: STEP_ORDER[idx + 1] })
  },

  back: () => {
    const idx = STEP_ORDER.indexOf(get().step)
    if (idx > 0) set({ step: STEP_ORDER[idx - 1] })
  },

  analyzeFile: async (file) => {
    set({ analyzing: true, error: null, step: 'analyze', fileName: file.name })
    try {
      const bytes = await file.arrayBuffer()
      const result = await appServices.migration.analyze(
        {
          fileName: file.name,
          mimeType: file.type || guessMime(file.name),
          bytes,
        },
        {
          mode: get().mode,
          mappingRules: { rules: get().mappingRules },
        },
      )
      const diffs =
        get().mode === 'update' && appServices.catalog
          ? await loadDiffs(result.draft)
          : []
      set({
        draft: result.draft,
        summary: result.summary,
        validation: result.validation,
        ambiguous: result.ambiguousTokens,
        diffs,
        selectedDiffKeys: diffs.map((item) => `${item.entityType}:${item.key}:${item.field}`),
        step: 'review',
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Ошибка анализа',
        step: 'file',
      })
    } finally {
      set({ analyzing: false })
    }
  },

  loadSample: async () => {
    set({ analyzing: true, error: null, step: 'analyze', fileName: 'sample-cki-board.json' })
    try {
      const response = await fetch('/fixtures/sample-cki-board.json')
      if (!response.ok) throw new Error('Не удалось загрузить sample fixture')
      const bytes = await response.arrayBuffer()
      const result = await appServices.migration.analyze(
        {
          fileName: 'sample-cki-board.json',
          mimeType: 'application/json',
          bytes,
        },
        {
          mode: get().mode,
          mappingRules: { rules: get().mappingRules },
        },
      )
      const diffs = get().mode === 'update' ? await loadDiffs(result.draft) : []
      set({
        draft: result.draft,
        summary: result.summary,
        validation: result.validation,
        ambiguous: result.ambiguousTokens,
        diffs,
        selectedDiffKeys: diffs.map((item) => `${item.entityType}:${item.key}:${item.field}`),
        step: 'review',
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Ошибка загрузки sample',
        step: 'file',
      })
    } finally {
      set({ analyzing: false })
    }
  },

  updateStoryTitle: (tempId, title) => {
    const draft = get().draft
    if (!draft) return
    set({
      draft: {
        ...draft,
        stories: draft.stories.map((story) =>
          story.tempId === tempId ? { ...story, title, needsReview: false } : story,
        ),
      },
    })
  },

  removeStory: (tempId) => {
    const draft = get().draft
    if (!draft) return
    set({
      draft: {
        ...draft,
        stories: draft.stories.filter((story) => story.tempId !== tempId),
      },
    })
  },

  resolveMapping: (token, target) => {
    const rule = createMappingRule(
      token.field === 'sprint' || token.field === 'quarter' ? 'column' : token.field,
      token.token,
      target,
    )
    const rules = upsertMappingRule(rule)
    const draft = get().draft
    if (!draft) {
      set({ mappingRules: rules })
      return
    }

    let stories = draft.stories
    if (token.field === 'status') {
      stories = stories.map((story) =>
        story.tempId === token.storyTempId ||
        story.stageHints?.some((hint) => hint === token.token)
          ? { ...story, status: target as typeof story.status, stageHints: [target] }
          : story,
      )
    }
    if (token.field === 'role' || token.field === 'person') {
      stories = stories.map((story) => {
        if (token.storyTempId && story.tempId !== token.storyTempId) return story
        return {
          ...story,
          ownerName: token.field === 'person' ? target : story.ownerName,
          assigneeHints: [target],
        }
      })
    }
    if (token.field === 'sprint') {
      stories = stories.map((story) =>
        story.tempId === token.storyTempId ? { ...story, sprintName: target } : story,
      )
    }
    if (token.field === 'quarter') {
      stories = stories.map((story) =>
        story.tempId === token.storyTempId ? { ...story, quarterKey: target } : story,
      )
    }
    if (token.field === 'work_type') {
      stories = stories.map((story) =>
        story.tempId === token.storyTempId
          ? { ...story, storyType: target as typeof story.storyType }
          : story,
      )
    }

    set({
      mappingRules: rules,
      draft: { ...draft, stories, mappingRules: rules },
      ambiguous: get().ambiguous.filter(
        (item) => !(item.field === token.field && item.token === token.token),
      ),
    })
  },

  toggleDiff: (key) => {
    const selected = new Set(get().selectedDiffKeys)
    if (selected.has(key)) selected.delete(key)
    else selected.add(key)
    set({ selectedDiffKeys: [...selected] })
  },

  selectAllDiffs: () => {
    set({
      selectedDiffKeys: get().diffs.map(
        (item) => `${item.entityType}:${item.key}:${item.field}`,
      ),
    })
  },

  applyImport: async (productId) => {
    const draft = get().draft
    if (!draft) return
    set({ applying: true, error: null })
    try {
      const result = await appServices.migrationApply.apply({
        productId,
        draft,
        mode: get().mode,
        selectedDiffKeys: get().selectedDiffKeys,
      })
      set({ journal: result.journal, step: 'journal' })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Ошибка импорта' })
    } finally {
      set({ applying: false })
    }
  },
}))

function guessMime(fileName: string): string {
  if (fileName.endsWith('.pdf')) return 'application/pdf'
  if (fileName.endsWith('.json')) return 'application/json'
  if (fileName.endsWith('.csv')) return 'text/csv'
  return 'application/octet-stream'
}

async function loadDiffs(draft: ImportDraft): Promise<UpdateDiffItem[]> {
  const summary = await appServices.catalog.getWorkspaceSummary()
  return appServices.migrationApply.previewDiffs(summary.product.id, draft)
}
