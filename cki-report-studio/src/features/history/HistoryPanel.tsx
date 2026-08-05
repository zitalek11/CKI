import { useReportStore } from '@/stores/report-store'
import { Button } from '@/shared/ui/primitives'
import { formatReportDate } from '@/core/format/format'

export function HistoryPanel() {
  const library = useReportStore((s) => s.library)
  const activeId = useReportStore((s) => s.activeId)
  const openReport = useReportStore((s) => s.openReport)
  const setMode = useReportStore((s) => s.setMode)
  const createNewWeek = useReportStore((s) => s.createNewWeek)

  const items = Object.values(library).sort((a, b) => b.meta.reportDate.localeCompare(a.meta.reportDate))

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">История отчётов</h2>
        <Button variant="secondary" onClick={() => createNewWeek()}>
          Новая неделя
        </Button>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
        {items.map((report) => (
          <button
            key={report.meta.id}
            onClick={() => openReport(report.meta.id)}
            className={`w-full rounded-xl border p-3 text-left transition ${
              report.meta.id === activeId
                ? 'border-violet-500/50 bg-violet-500/10'
                : 'border-white/10 bg-black/20 hover:bg-white/5'
            }`}
          >
            <div className="font-semibold">
              Неделя {report.meta.weekNumber} · {formatReportDate(report.meta.reportDate)}
            </div>
            <div className="mt-1 text-xs text-[#8b8bb8]">
              {report.meta.status} · {report.meta.id}
            </div>
          </button>
        ))}
      </div>
      <Button variant="ghost" onClick={() => setMode('editor')}>
        Назад к редактору
      </Button>
    </div>
  )
}
