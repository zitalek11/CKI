import { useEffect, useMemo, useState } from 'react'
import { appServices } from '@/application/composition'
import { calculateRoleDemand, calculateUtilization } from '@/domain/engines/capacity/demand'
import { calculateRoleSupply } from '@/domain/engines/capacity/supply'
import { useWorkspaceStore } from '@/features/workspace/model/workspace-store'
import { Badge } from '@/shared/ui/badge'

type RoleRow = {
  code: string
  name: string
  demandHours: number
  supplyHours: number
  utilization: number
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
      const sprint = summary.sprint
      const periodStart = sprint?.startDate ?? summary.quarter?.startDate ?? '2026-08-01'
      const periodEnd = sprint?.endDate ?? summary.quarter?.endDate ?? '2026-08-31'

      const demand = calculateRoleDemand(
        db.workItems.filter((item) => item.productId === summary.product.id),
      )
      const supply = calculateRoleSupply({
        employees: db.employees.filter((item) => item.productId === summary.product.id),
        employeeSkills: db.employeeSkills,
        periodStart,
        periodEnd,
      })
      const supplyMap = new Map(supply.map((item) => [item.roleSkillId, item.availableHours]))

      const roleIds = new Set([
        ...demand.map((item) => item.roleSkillId),
        ...supply.map((item) => item.roleSkillId),
      ])

      const mapped = [...roleIds].map((roleSkillId) => {
        const role = db.roleSkills.find((roleSkill) => roleSkill.id === roleSkillId)
        const demandRow = demand.find((item) => item.roleSkillId === roleSkillId)
        const supplyHours = supplyMap.get(roleSkillId) ?? 0
        const demandHours = demandRow?.hours ?? 0
        return {
          code: role?.code ?? '?',
          name: role?.name ?? 'Неизвестно',
          demandHours,
          supplyHours,
          utilization: calculateUtilization(demandHours, supplyHours),
          workItemCount: demandRow?.workItemCount ?? 0,
        }
      })

      mapped.sort((a, b) => b.utilization - a.utilization)
      if (!cancelled) setRows(mapped)
    })()
    return () => {
      cancelled = true
    }
  }, [summary, workItemCount])

  const totalDemand = useMemo(() => rows.reduce((sum, row) => sum + row.demandHours, 0), [rows])

  return (
    <section className="flex h-full flex-col gap-4 p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight">Загрузка</h1>
          <p className="text-[var(--color-text-secondary)]">
            Спрос и предложение по ролям (focus factor 0.75, рабочий календарь).
          </p>
        </div>
        <Badge tone="accent">{totalDemand} ч спроса</Badge>
      </header>

      <div className="space-y-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4">
        {rows.length === 0 ? (
          <p className="text-[var(--color-text-tertiary)]">Нет данных по ролям.</p>
        ) : (
          rows.map((row) => {
            const pct = Number.isFinite(row.utilization) ? Math.round(row.utilization * 100) : 999
            const tone =
              pct > 100 ? 'danger' : pct > 85 ? 'warning' : pct === 0 ? 'neutral' : 'success'
            const width = Math.min(pct, 100)
            return (
              <div key={row.code} className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-[13px]">
                  <span className="font-medium">
                    {row.code} · {row.name}
                  </span>
                  <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                    <span>
                      {row.demandHours} ч / {row.supplyHours} ч
                    </span>
                    <Badge tone={tone}>{pct}%</Badge>
                  </div>
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
