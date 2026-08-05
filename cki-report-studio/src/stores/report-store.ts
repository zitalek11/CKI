import { create } from 'zustand'
import { temporal } from 'zundo'
import { immer } from 'zustand/middleware/immer'
import type { WeeklyReport } from '@/core/model/types'
import { deriveReport } from '@/core/derive/derive-report'
import { createNextWeek } from '@/core/week/create-next-week'
import { validateReport, type ValidationIssue } from '@/core/validate/validate-report'
import { parseReportJson, applyMetricCsv } from '@/core/import/import-report'
import seed from '../../resources/reports/2026-07-23.json'
import {
  loadActiveId,
  loadLibrary,
  persistActiveId,
  persistLibrary,
} from '@/shared/lib/storage'

export type AppMode = 'editor' | 'wizard' | 'history'
export type EditorSection =
  | 'general'
  | 'metrics'
  | 'funnel'
  | 'activities'
  | 'roadmap'
  | 'charts'
  | 'team'
  | 'products'

function seedLibrary(): Record<string, WeeklyReport> {
  const seedReport = seed as WeeklyReport
  return { [seedReport.meta.id]: seedReport }
}

function getPrevious(library: Record<string, WeeklyReport>, report: WeeklyReport): WeeklyReport | null {
  if (!report.meta.previousReportId) return null
  return library[report.meta.previousReportId] ?? null
}

interface ReportState {
  hydrated: boolean
  library: Record<string, WeeklyReport>
  activeId: string
  previous: WeeklyReport | null
  mode: AppMode
  section: EditorSection
  wizardStep: number
  searchQuery: string
  issues: ValidationIssue[]

  report: () => WeeklyReport
  hydrate: () => Promise<void>
  setMode: (mode: AppMode) => void
  setSection: (section: EditorSection) => void
  setWizardStep: (step: number) => void
  setSearchQuery: (q: string) => void
  openReport: (id: string) => void
  patchReport: (mutator: (draft: WeeklyReport) => void) => void
  setMetricValue: (id: string, value: number) => void
  setFieldByPath: (path: string, value: string | number) => void
  createNewWeek: (reportDate?: string) => void
  importJson: (raw: string) => void
  importMetricsCsv: (csv: string) => void
  revalidate: () => void
  refreshPrevious: () => void
}

const initialLibrary = seedLibrary()
const initialId = Object.keys(initialLibrary)[0]!

export const useReportStore = create<ReportState>()(
  temporal(
    immer((set, get) => ({
      hydrated: false,
      library: initialLibrary,
      activeId: initialId,
      previous: null,
      mode: 'editor' as AppMode,
      section: 'metrics' as EditorSection,
      wizardStep: 1,
      searchQuery: '',
      issues: validateReport(initialLibrary[initialId]!),

      report: () => get().library[get().activeId],

      hydrate: async () => {
        try {
          const library = await loadLibrary()
          const fallback = Object.keys(library).sort().at(-1)!
          const activeIdCandidate = await loadActiveId(fallback)
          const activeId = library[activeIdCandidate] ? activeIdCandidate : fallback
          const active = library[activeId]
          set((state) => {
            state.library = library
            state.activeId = activeId
            state.previous = getPrevious(library, active)
            state.issues = validateReport(active)
            state.hydrated = true
          })
          void persistActiveId(activeId)
          void persistLibrary(library)
        } catch (error) {
          console.error('hydrate failed', error)
          // Always unlock UI even if FS fails
          set((state) => {
            state.hydrated = true
          })
        }
      },

      setMode: (mode) => set({ mode }),
      setSection: (section) => set({ section }),
      setWizardStep: (wizardStep) => set({ wizardStep }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),

      openReport: (id) => {
        set((state) => {
          if (!state.library[id]) return
          state.activeId = id
          state.previous = getPrevious(state.library, state.library[id])
          state.issues = validateReport(state.library[id])
          state.mode = 'editor'
        })
        void persistActiveId(id)
      },

      patchReport: (mutator) => {
        set((state) => {
          const draft = state.library[state.activeId]
          mutator(draft)
          draft.meta.updatedAt = new Date().toISOString()
          state.previous = getPrevious(state.library, draft)
          state.issues = validateReport(draft)
        })
        void persistLibrary(get().library)
      },

      setMetricValue: (id, value) =>
        get().patchReport((draft) => {
          const metric = draft.metrics.find((m) => m.id === id)
          if (metric) metric.value = value
        }),

      setFieldByPath: (path, value) =>
        get().patchReport((draft) => {
          if (path === 'meta.reportDate' && typeof value === 'string') {
            draft.meta.reportDate = value
            draft.meta.id = value
          } else if (path === 'meta.weekNumber') {
            draft.meta.weekNumber = Number(value)
          } else if (path.startsWith('metrics.') && path.endsWith('.value')) {
            const id = path.slice('metrics.'.length, -'.value'.length)
            const metric = draft.metrics.find((m) => m.id === id)
            if (metric) metric.value = Number(value)
          } else if (path.startsWith('funnel.stages.') && path.endsWith('.count')) {
            const id = path.slice('funnel.stages.'.length, -'.count'.length)
            const stage = draft.funnel.stages.find((s) => s.id === id)
            if (stage) stage.count = Number(value)
          } else if (path.startsWith('funnel.stages.') && path.endsWith('.amountThousands')) {
            const id = path.slice('funnel.stages.'.length, -'.amountThousands'.length)
            const stage = draft.funnel.stages.find((s) => s.id === id)
            if (stage) stage.amountThousands = Number(value)
          } else if (path.startsWith('funnel.comments.') && path.endsWith('.text')) {
            const id = path.slice('funnel.comments.'.length, -'.text'.length)
            const comment = draft.funnel.comments.find((c) => c.id === id)
            if (comment) comment.text = String(value)
          } else if (path === 'general.title') {
            draft.general.title = String(value)
          } else if (path === 'general.subtitle') {
            draft.general.subtitle = String(value)
          }
        }),

      createNewWeek: (reportDate) => {
        set((state) => {
          const current = state.library[state.activeId]
          const next = createNextWeek(current, reportDate ? { reportDate } : {})
          state.library[next.meta.id] = next
          state.activeId = next.meta.id
          state.previous = current
          state.issues = validateReport(next)
          state.mode = 'wizard'
          state.wizardStep = 1
        })
        const { activeId, library } = get()
        void persistLibrary(library)
        void persistActiveId(activeId)
      },

      importJson: (raw) => {
        set((state) => {
          const report = parseReportJson(raw)
          state.library[report.meta.id] = report
          state.activeId = report.meta.id
          state.previous = getPrevious(state.library, report)
          state.issues = validateReport(report)
        })
        const { activeId, library } = get()
        void persistLibrary(library)
        void persistActiveId(activeId)
      },

      importMetricsCsv: (csv) => {
        set((state) => {
          const updated = applyMetricCsv(state.library[state.activeId], csv)
          state.library[state.activeId] = updated
          state.issues = validateReport(updated)
        })
        void persistLibrary(get().library)
      },

      revalidate: () =>
        set((state) => {
          state.issues = validateReport(state.library[state.activeId])
        }),

      refreshPrevious: () =>
        set((state) => {
          state.previous = getPrevious(state.library, state.library[state.activeId])
        }),
    })),
    { limit: 50 },
  ),
)

export function useActiveReport(): WeeklyReport {
  return useReportStore((s) => s.library[s.activeId])
}

export function useViewModel() {
  const report = useActiveReport()
  const previous = useReportStore((s) => s.previous)
  return deriveReport(report, previous)
}
