import { describe, expect, it } from 'vitest'
import { calculateRoleDemand, calculateUtilization } from '@/domain/engines/capacity/demand'
import type { WorkItem } from '@/domain/model/entities'
import { WorkItemOrigin, WorkItemStatus } from '@/domain/model/enums'
import { createId } from '@/domain/model/ids'

function wi(role: string, hours: number, status: WorkItemStatus = WorkItemStatus.Planned): WorkItem {
  const now = new Date().toISOString()
  return {
    id: createId(),
    productId: createId(),
    userStoryId: createId(),
    key: 'CKI-1-X',
    title: 'x',
    workTypeId: createId(),
    requiredRoleSkillId: role as WorkItem['requiredRoleSkillId'],
    status,
    origin: WorkItemOrigin.Template,
    isMandatory: true,
    estimateHours: hours,
    createdAt: now,
    updatedAt: now,
    createdBy: 't',
    updatedBy: 't',
  }
}

describe('capacity demand', () => {
  it('aggregates open work by role', () => {
    const roleA = createId()
    const roleB = createId()
    const demand = calculateRoleDemand([
      wi(roleA, 8),
      wi(roleA, 4),
      wi(roleB, 10),
      wi(roleB, 5, WorkItemStatus.Done),
    ])
    expect(demand).toEqual([
      { roleSkillId: roleA, hours: 12, workItemCount: 2 },
      { roleSkillId: roleB, hours: 10, workItemCount: 1 },
    ])
  })

  it('calculates utilization', () => {
    expect(calculateUtilization(40, 40)).toBe(1)
    expect(calculateUtilization(50, 40)).toBe(1.25)
  })
})
