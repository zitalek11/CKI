import { useRef } from 'react'
import {
  History,
  Redo2,
  Undo2,
  Download,
  Wand2,
  Plus,
  Upload,
  FileJson,
} from 'lucide-react'
import { useStore } from 'zustand'
import { useReportStore, useActiveReport } from '@/stores/report-store'
import { EditorPanel } from '@/features/editor/EditorPanel'
import { LivePreview } from '@/features/preview/LivePreview'
import { WizardPanel } from '@/features/wizard/WizardPanel'
import { HistoryPanel } from '@/features/history/HistoryPanel'
import { exportHtmlFile, exportJsonFile } from '@/features/export/export-html'
import { Button, Panel } from '@/shared/ui/primitives'
import { formatReportDate } from '@/core/format/format'

export function AppShell() {
  const mode = useReportStore((s) => s.mode)
  const wizardStep = useReportStore((s) => s.wizardStep)
  const setMode = useReportStore((s) => s.setMode)
  const issues = useReportStore((s) => s.issues)
  const createNewWeek = useReportStore((s) => s.createNewWeek)
  const importJson = useReportStore((s) => s.importJson)
  const importMetricsCsv = useReportStore((s) => s.importMetricsCsv)
  const previous = useReportStore((s) => s.previous)
  const report = useActiveReport()
  const fileRef = useRef<HTMLInputElement>(null)
  const csvRef = useRef<HTMLInputElement>(null)

  const temporal = useStore(useReportStore.temporal)

  const doExport = () => {
    const result = exportHtmlFile(report, previous)
    if (!result.ok) {
      alert(`Экспорт заблокирован:\n${result.message}`)
      return
    }
    useReportStore.getState().patchReport((d) => {
      d.meta.status = 'exported'
    })
  }

  return (
    <div className="flex h-full flex-col gap-3 p-3 md:p-4">
      <header className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-[#12121f]/80 px-4 py-3 backdrop-blur">
        <div className="mr-auto">
          <div className="text-xs uppercase tracking-[0.2em] text-violet-300">CKI Report Studio</div>
          <div className="text-sm text-[#b8b8e0]">
            Неделя {report.meta.weekNumber} · {formatReportDate(report.meta.reportDate)} ·{' '}
            <span className="text-white/70">{report.meta.status}</span>
          </div>
        </div>
        <Button variant="ghost" onClick={() => temporal.undo()} disabled={!temporal.pastStates.length} title="Undo">
          <Undo2 size={16} />
        </Button>
        <Button variant="ghost" onClick={() => temporal.redo()} disabled={!temporal.futureStates.length} title="Redo">
          <Redo2 size={16} />
        </Button>
        <Button variant="secondary" onClick={() => setMode('history')}>
          <History size={16} /> История
        </Button>
        <Button variant="secondary" onClick={() => setMode('wizard')}>
          <Wand2 size={16} /> Мастер недели
        </Button>
        <Button variant="secondary" onClick={() => createNewWeek()}>
          <Plus size={16} /> Новый отчёт
        </Button>
        <Button variant="ghost" onClick={() => fileRef.current?.click()}>
          <Upload size={16} /> JSON
        </Button>
        <Button variant="ghost" onClick={() => csvRef.current?.click()}>
          CSV
        </Button>
        <Button variant="ghost" onClick={() => exportJsonFile(report)}>
          <FileJson size={16} />
        </Button>
        <Button onClick={doExport}>
          <Download size={16} /> Экспорт HTML
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (!file) return
            importJson(await file.text())
            e.target.value = ''
          }}
        />
        <input
          ref={csvRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (!file) return
            importMetricsCsv(await file.text())
            e.target.value = ''
          }}
        />
      </header>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[380px_1fr]">
        <Panel className="min-h-0 overflow-hidden p-3">
          {mode === 'editor' && <EditorPanel />}
          {mode === 'wizard' && <WizardPanel onExport={doExport} />}
          {mode === 'history' && <HistoryPanel />}
        </Panel>
        <div className="min-h-0">
          {mode === 'wizard' && wizardStep === 8 ? (
            <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-white/15 text-sm text-[#8b8bb8]">
              Предпросмотр открыт в панели мастера слева
            </div>
          ) : (
            <LivePreview />
          )}
        </div>
      </div>

      <footer className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-[#12121f]/80 px-4 py-2 text-xs text-[#8b8bb8]">
        <span>
          Ошибки: {issues.filter((i) => i.level === 'error').length} · Предупреждения:{' '}
          {issues.filter((i) => i.level === 'warning').length}
        </span>
        <span className="ml-auto">Данные → Preview → HTML. HTML вручную больше не редактируется.</span>
        <Button onClick={doExport}>
          <Download size={14} /> Экспорт HTML
        </Button>
      </footer>
    </div>
  )
}
