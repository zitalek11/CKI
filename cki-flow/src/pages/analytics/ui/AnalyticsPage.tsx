import { useEffect, useState } from 'react'
import { appServices } from '@/application/composition'
import { useWorkspaceStore } from '@/features/workspace/model/workspace-store'
import { labelHealth } from '@/shared/lib/labels'
import { Badge } from '@/shared/ui/badge'

type Pulse = Awaited<ReturnType<typeof appServices.analytics.getPulse>>

export function AnalyticsPage() {
  const summary = useWorkspaceStore((s) => s.summary)
  const [pulse, setPulse] = useState<Pulse | null>(null)

  useEffect(() => {
    if (!summary) return
    void appServices.analytics.getPulse(summary.product.id).then(setPulse)
  }, [summary, summary?.counts.stories, summary?.counts.workItems])

  if (!pulse) {
    return <div className="p-6 text-[var(--color-text-tertiary)]">Загрузка аналитики…</div>
  }

  const healthTone =
    pulse.health === 'on_track' ? 'success' : pulse.health === 'at_risk' ? 'warning' : 'danger'

  return (
    <section className="flex h-full flex-col gap-4 p-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Пульс</h1>
          <p className="text-[var(--color-text-secondary)]">
            Сводка за минуту · {pulse.quarterKey} · {pulse.sprintName}
          </p>
        </div>
        <Badge tone={healthTone}>{labelHealth(pulse.health)}</Badge>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <PulseCard label="Средний прогресс" value={`${pulse.avgProgress}%`} />
        <PulseCard label="Готовых Story" value={`${pulse.doneStories}/${pulse.totalStories}`} />
        <PulseCard
          label="Узкое место"
          value={
            pulse.bottleneck
              ? `${pulse.bottleneck.code} ${Math.round(pulse.bottleneck.utilization * 100)}%`
              : '—'
          }
        />
        <PulseCard
          label="Готовность релиза"
          value={
            pulse.releaseReadiness
              ? `${pulse.releaseReadiness.readinessPercent}%`
              : 'Нет релиза'
          }
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4">
          <h2 className="mb-3 text-[13px] font-semibold">Утилизация ролей</h2>
          <div className="space-y-2">
            {pulse.roleBars.map((row) => {
              const pct = Math.min(Math.round(row.utilization * 100), 100)
              return (
                <div key={row.code}>
                  <div className="mb-1 flex justify-between text-[12px]">
                    <span>{row.code}</span>
                    <span className="text-[var(--color-text-secondary)]">
                      {row.demandHours} ч / {Math.round(row.supplyHours)} ч
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--color-bg-subtle)]">
                    <div
                      className="h-full rounded-full bg-[var(--color-accent)]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4">
          <h2 className="mb-3 text-[13px] font-semibold">Недавние события</h2>
          <ul className="space-y-2">
            {pulse.events.length === 0 && (
              <li className="text-[12px] text-[var(--color-text-tertiary)]">Событий пока нет</li>
            )}
            {pulse.events.map((event) => (
              <li key={event.id} className="text-[12px]">
                <span className="font-medium">{event.type}</span>
                <span className="text-[var(--color-text-tertiary)]">
                  {' '}
                  · {new Date(event.occurredAt).toLocaleString('ru-RU')}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 text-[12px] text-[var(--color-text-secondary)]">
            Заблокированных задач: {pulse.blocked}
          </div>
        </div>
      </div>
    </section>
  )
}

function PulseCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4">
      <div className="text-[11px] text-[var(--color-text-tertiary)]">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  )
}
