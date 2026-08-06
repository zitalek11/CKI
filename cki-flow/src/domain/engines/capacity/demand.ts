import type { WorkItem } from '@/domain/model/entities'
import { WorkItemStatus } from '@/domain/model/enums'

export type RoleDemand = {
  roleSkillId: string
  hours: number
  workItemCount: number
}

/** Pure Capacity Engine (demand side) — supply/calendar arrive in later iteration. */
export function calculateRoleDemand(workItems: WorkItem[]): RoleDemand[] {
  const map = new Map<string, RoleDemand>()

  for (const item of workItems) {
    if (item.status === WorkItemStatus.Cancelled || item.status === WorkItemStatus.Done) continue
    const current = map.get(item.requiredRoleSkillId) ?? {
      roleSkillId: item.requiredRoleSkillId,
      hours: 0,
      workItemCount: 0,
    }
    current.hours += item.estimateHours
    current.workItemCount += 1
    map.set(item.requiredRoleSkillId, current)
  }

  return [...map.values()].sort((a, b) => b.hours - a.hours)
}

export function calculateUtilization(demandHours: number, supplyHours: number): number {
  if (supplyHours <= 0) return demandHours > 0 ? Number.POSITIVE_INFINITY : 0
  return demandHours / supplyHours
}
