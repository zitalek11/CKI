import { useReportStore } from '@/stores/report-store'
import { EditorPanel } from '@/features/editor/EditorPanel'
import { Button } from '@/shared/ui/primitives'
import { LivePreview } from '@/features/preview/LivePreview'

const STEPS = [
  { n: 1, title: 'Дата и неделя', section: 'general' as const },
  { n: 2, title: 'KPI', section: 'metrics' as const },
  { n: 3, title: 'Воронка', section: 'funnel' as const },
  { n: 4, title: 'Активности', section: 'activities' as const },
  { n: 5, title: 'Roadmap', section: 'roadmap' as const },
  { n: 6, title: 'Графики', section: 'charts' as const },
  { n: 7, title: 'Проверка', section: 'metrics' as const },
  { n: 8, title: 'Предпросмотр', section: 'metrics' as const },
  { n: 9, title: 'Экспорт', section: 'metrics' as const },
]

export function WizardPanel({ onExport }: { onExport: () => void }) {
  const wizardStep = useReportStore((s) => s.wizardStep)
  const setWizardStep = useReportStore((s) => s.setWizardStep)
  const setSection = useReportStore((s) => s.setSection)
  const setMode = useReportStore((s) => s.setMode)
  const issues = useReportStore((s) => s.issues)
  const step = STEPS[wizardStep - 1]

  const go = (n: number) => {
    const next = STEPS[n - 1]
    setWizardStep(n)
    if (next) setSection(next.section)
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex flex-wrap gap-1">
        {STEPS.map((s) => (
          <button
            key={s.n}
            className={`rounded-full px-2 py-1 text-[11px] ${
              s.n === wizardStep ? 'bg-violet-600 text-white' : 'bg-white/5 text-[#8b8bb8]'
            }`}
            onClick={() => go(s.n)}
          >
            {s.n}. {s.title}
          </button>
        ))}
      </div>

      <div className="text-lg font-semibold">
        Шаг {wizardStep}: {step.title}
      </div>

      {wizardStep <= 6 && (
        <div className="min-h-0 flex-1 overflow-hidden">
          <EditorPanel />
        </div>
      )}

      {wizardStep === 7 && (
        <div className="space-y-2 overflow-y-auto rounded-xl border border-white/10 p-3 text-sm">
          {issues.length === 0 ? (
            <div className="text-emerald-300">Ошибок нет — можно экспортировать.</div>
          ) : (
            issues.map((issue) => (
              <div
                key={`${issue.path}-${issue.message}`}
                className={issue.level === 'error' ? 'text-red-300' : 'text-amber-300'}
              >
                [{issue.level}] {issue.path}: {issue.message}
              </div>
            ))
          )}
        </div>
      )}

      {wizardStep === 8 && (
        <div className="min-h-0 flex-1">
          <LivePreview />
        </div>
      )}

      {wizardStep === 9 && (
        <div className="rounded-xl border border-white/10 p-4 text-sm text-[#b8b8e0]">
          Нажмите «Экспорт HTML», чтобы сохранить готовый отчёт. Мастер можно закрыть и вернуться в
          обычный редактор.
          <div className="mt-3 flex gap-2">
            <Button onClick={onExport}>Экспорт HTML</Button>
            <Button variant="secondary" onClick={() => setMode('editor')}>
              В редактор
            </Button>
          </div>
        </div>
      )}

      <div className="flex justify-between gap-2">
        <Button variant="ghost" disabled={wizardStep <= 1} onClick={() => go(wizardStep - 1)}>
          Назад
        </Button>
        {wizardStep < 9 ? (
          <Button onClick={() => go(wizardStep + 1)}>Далее</Button>
        ) : (
          <Button onClick={() => setMode('editor')}>Готово</Button>
        )}
      </div>
    </div>
  )
}
