import { useEffect, useState } from 'react'
import { appServices } from '@/application/composition'
import { useWorkspaceStore } from '@/features/workspace/model/workspace-store'
import { labelHealth, labelOrRaw } from '@/shared/lib/labels'
import { Badge } from '@/shared/ui/badge'

type Overview = Awaited<ReturnType<typeof appServices.quarters.getOverview>>

export function QuarterPage() {
  const summary = useWorkspaceStore((s) => s.summary)
  const [data, setData] = useState<Overview | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!summary) return
    void appServices.quarters
      .getOverview(summary.product.id)
      .then(setData)
      .catch((err: Error) => setError(err.message))
  }, [summary, summary?.counts.stories])

  if (error) {
    return <div className="p-6 text-[var(--color-danger)]">{error}</div>
  }
  if (!data) {
    return <div className="p-6 text-[var(--color-text-tertiary)]">Загрузка квартала…</div>
  }

  const healthTone =
    data.health === 'on_track' ? 'success' : data.health === 'at_risk' ? 'warning' : 'danger'

  return (
    <section className="flex h-full flex-col gap-4 p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">{data.quarter.key}</h1>
          <p className="text-[var(--color-text-secondary)]">
            {data.quarter.startDate} → {data.quarter.endDate} · {data.counts.initiatives} инициатив ·{' '}
            {data.counts.stories} User Story
          </p>
        </div>
        <Badge tone={healthTone}>Состояние: {labelHealth(data.health)}</Badge>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        {data.goals.map((goal) => (
          <article
            key={goal.id}
            className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4"
          >
            <div className="text-[11px] text-[var(--color-text-tertiary)] uppercase">
              {labelOrRaw(goal.status)}
            </div>
            <h2 className="mt-1 font-semibold">{goal.title}</h2>
            <p className="mt-1 text-[12px] text-[var(--color-text-secondary)]">{goal.statement}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4">
          <h2 className="mb-3 text-[13px] font-semibold">Инициатива → Epic</h2>
          <div className="space-y-3">
            {data.tree.map((node) => (
              <div key={node.initiative.id}>
                <div className="font-medium">
                  {node.initiative.key} · {node.initiative.title}
                </div>
                <div className="mt-1 space-y-1 border-l border-[var(--color-border-subtle)] pl-3">
                  {node.epics.map((epicNode) => (
                    <div
                      key={epicNode.epic.id}
                      className="flex items-center justify-between text-[13px] text-[var(--color-text-secondary)]"
                    >
                      <span>
                        {epicNode.epic.key} · {epicNode.epic.title}
                      </span>
                      <span>
                        {epicNode.storyCount} US · {epicNode.progress}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4">
          <h2 className="mb-3 text-[13px] font-semibold">Давление по ролям (квартал)</h2>
          <div className="space-y-2">
            {data.rolePressure.map((row) => (
              <div key={row.code} className="flex items-center justify-between text-[13px]">
                <span>{row.code}</span>
                <span className="text-[var(--color-text-secondary)]">
                  {row.demandHours} ч / {Math.round(row.supplyHours)} ч ·{' '}
                  {Math.round(row.utilization * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
