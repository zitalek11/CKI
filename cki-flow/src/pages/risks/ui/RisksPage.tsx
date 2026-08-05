import { useEffect, useState } from 'react'
import { appServices } from '@/application/composition'
import { computeWorkItemRuntimeState } from '@/domain/engines/dependency/ready-state'
import { useWorkspaceStore } from '@/features/workspace/model/workspace-store'
import { Badge } from '@/shared/ui/badge'

type RiskRow = {
  id: string
  severity: 'high' | 'medium' | 'low'
  title: string
  detail: string
}

export function RisksPage() {
  const summary = useWorkspaceStore((s) => s.summary)
  const [rows, setRows] = useState<RiskRow[]>([])

  useEffect(() => {
    if (!summary) return
    void (async () => {
      const db = await appServices.uow.read()
      const workItems = db.workItems.filter((item) => item.productId === summary.product.id)
      const deps = db.dependencies.filter((item) => item.productId === summary.product.id)
      const runtime = computeWorkItemRuntimeState(workItems, deps)
      const next: RiskRow[] = []

      for (const item of workItems) {
        if (runtime.get(item.id)?.blocked) {
          const story = db.userStories.find((story) => story.id === item.userStoryId)
          next.push({
            id: item.id,
            severity: 'high',
            title: `Blocked: ${item.key}`,
            detail: `${story?.key ?? '?'} · ${item.title}`,
          })
        }
      }

      const pulse = await appServices.analytics.getPulse(summary.product.id)
      if (pulse.bottleneck && pulse.bottleneck.utilization > 1) {
        next.push({
          id: 'bottleneck',
          severity: pulse.bottleneck.utilization > 1.2 ? 'high' : 'medium',
          title: `Capacity overload: ${pulse.bottleneck.code}`,
          detail: `${Math.round(pulse.bottleneck.utilization * 100)}% utilization`,
        })
      }
      if (pulse.releaseReadiness && pulse.releaseReadiness.riskLevel !== 'low') {
        next.push({
          id: 'release',
          severity: pulse.releaseReadiness.riskLevel === 'critical' ? 'high' : 'medium',
          title: `Release risk: ${pulse.releaseReadiness.release.name}`,
          detail: `Readiness ${pulse.releaseReadiness.readinessPercent}% · ${pulse.releaseReadiness.riskLevel}`,
        })
      }

      setRows(next)
    })()
  }, [summary, summary?.counts.workItems])

  return (
    <section className="flex h-full flex-col gap-4 p-6">
      <header>
        <h1 className="text-lg font-semibold">Risks</h1>
        <p className="text-[var(--color-text-secondary)]">
          Блокеры, перегруз ролей и риск релиза — из Domain engines.
        </p>
      </header>
      <div className="space-y-2">
        {rows.length === 0 ? (
          <p className="text-[var(--color-text-tertiary)]">Открытых рисков нет.</p>
        ) : (
          rows.map((row) => (
            <article
              key={row.id}
              className="flex items-start justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] px-4 py-3"
            >
              <div>
                <div className="font-medium">{row.title}</div>
                <div className="text-[12px] text-[var(--color-text-secondary)]">{row.detail}</div>
              </div>
              <Badge tone={row.severity === 'high' ? 'danger' : row.severity === 'medium' ? 'warning' : 'neutral'}>
                {row.severity}
              </Badge>
            </article>
          ))
        )}
      </div>
    </section>
  )
}
