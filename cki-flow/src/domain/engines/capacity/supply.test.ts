import { describe, expect, it } from 'vitest'
import { calculateRoleSupply } from '@/domain/engines/capacity/supply'
import type { Employee, EmployeeSkill } from '@/domain/model/entities'
import { createId } from '@/domain/model/ids'

describe('calculateRoleSupply', () => {
  it('accounts for focus factor and skill weight', () => {
    const employeeId = createId()
    const roleId = createId()
    const now = new Date().toISOString()
    const employees: Employee[] = [
      {
        id: employeeId,
        productId: createId(),
        displayName: 'SA',
        hoursPerDay: 8,
        workDaysPerWeek: 5,
        weeklyHours: 40,
        productAllocationPercent: 100,
        maxLoadPercent: 100,
        status: 'active',
        createdAt: now,
        updatedAt: now,
        createdBy: 't',
        updatedBy: 't',
      },
    ]
    const skills: EmployeeSkill[] = [
      { id: createId(), employeeId, roleSkillId: roleId, weight: 1 },
    ]

    // Wed 2026-08-05 .. Tue 2026-08-11 => working days: 5,6,7,10,11 = 5 days
    const supply = calculateRoleSupply({
      employees,
      employeeSkills: skills,
      periodStart: '2026-08-05',
      periodEnd: '2026-08-11',
      focusFactor: 0.75,
      hoursPerDay: 8,
    })

    expect(supply[0]?.roleSkillId).toBe(roleId)
    expect(supply[0]?.availableHours).toBe(30) // 5 * 8 * 0.75
  })
})
