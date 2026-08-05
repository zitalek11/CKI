import { useEffect, useMemo, useState } from 'react'
import { appServices } from '@/application/composition'
import { calculateRoleDemand } from '@/domain/engines/capacity/demand'
import { useWorkspaceStore } from '@/features/workspace/model/workspace-store'
import { Badge } from '@/shared/ui/badge'

type RoleRow = {
  code: string
  name: string
  hours: number
  workItemCount: number
}

export function LoadPage() {
  const summary = useWorkspaceStore((s) => s.summary)
  const workItemCount = summary?.counts.workItems ?? 0
  const [rows, setRows] = useState<RoleRow[]>([])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      if (!summary) return
      const db = await appServices.uow.read()
      const demand = calculateRoleDemand(
        db.workItems.filter((item) => item.productId === summary.product.id),
      )
      const mapped = demand.map((item) => {
        const role = db.roleSkills.find((roleSkill) => roleSkill.id === item.roleSkillId)
        return {
          code: role?.code ?? '?',
          name: role?.name ?? 'Unknown',
          hours: item.hours,
          workItemCount: item.workItemCount,
        }
      })
      if (!cancelled) setRows(mapped)
    })()
    return () => {
      cancelled = true
    }
  }, [summary, workItemCount])

  const total = useMemo(() => rows.reduce((sum, row) => sum + row.hours, 0), [rows])

  return (
    <section className="flex h-full flex-col gap-4 p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight">Load</h1>
          <p className="text-[var(--color-text-secondary)]">
            Demand по ролевым пулам из открытых WorkItems (Capacity Engine — demand side).
          </p>
        </div>
        <Badge tone="accent">{total}h open demand</Badge>
      </header>

      <div className="space-y-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4">
        {rows.length === 0 ? (
          <p className="text-[var(--color-text-tertiary)]">
            Нет открытых работ — создайте User Story, чтобы увидеть загрузку ролей.
          </p>
        ) : (
          rows.map((row) => {
            const width = total === 0 ? 0 : Math.round((row.hours / total) * 100)
            return (
              <div key={row.code} className="space-y-1">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="font-medium">
                    {row.code} · {row.name}
                  </span>
                  <span className="text-[var(--color-text-secondary)]">
                    {row.hours}h · {row.workItemCount} items
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--color-bg-subtle)]">
                  <div
                    className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-200"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}
