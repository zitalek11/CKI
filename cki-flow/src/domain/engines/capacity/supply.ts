import type { Employee, EmployeeSkill } from '@/domain/model/entities'
import { isWeekend, parseIsoDate, toIsoDate } from '@/domain/engines/planning/calendar'
import type { IsoDate } from '@/domain/model/system'

export type AbsenceRecord = {
  employeeId: string
  startDate: IsoDate
  endDate: IsoDate
  status: 'planned' | 'approved' | 'cancelled'
}

export type RoleSupply = {
  roleSkillId: string
  availableHours: number
}

function workingDaysBetween(start: IsoDate, end: IsoDate): IsoDate[] {
  const days: IsoDate[] = []
  const cursor = parseIsoDate(start)
  const last = parseIsoDate(end)
  while (cursor <= last) {
    if (!isWeekend(cursor)) days.push(toIsoDate(cursor))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return days
}

function absenceDays(absences: AbsenceRecord[], employeeId: string, periodDays: IsoDate[]): Set<string> {
  const set = new Set<string>()
  for (const absence of absences) {
    if (absence.employeeId !== employeeId) continue
    if (absence.status === 'cancelled') continue
    for (const day of periodDays) {
      if (day >= absence.startDate && day <= absence.endDate) set.add(day)
    }
  }
  return set
}

export function calculateRoleSupply(params: {
  employees: Employee[]
  employeeSkills: EmployeeSkill[]
  periodStart: IsoDate
  periodEnd: IsoDate
  focusFactor?: number
  hoursPerDay?: number
  absences?: AbsenceRecord[]
}): RoleSupply[] {
  const focusFactor = params.focusFactor ?? 0.75
  const hoursPerDay = params.hoursPerDay ?? 8
  const periodDays = workingDaysBetween(params.periodStart, params.periodEnd)
  const map = new Map<string, number>()

  for (const employee of params.employees) {
    if (employee.status !== 'active') continue
    const absent = absenceDays(params.absences ?? [], employee.id, periodDays)
    const availableDays = periodDays.length - absent.size
    const base =
      availableDays *
      hoursPerDay *
      (employee.productAllocationPercent / 100) *
      focusFactor

    const skills = params.employeeSkills.filter((skill) => skill.employeeId === employee.id)
    for (const skill of skills) {
      const hours = base * skill.weight
      map.set(skill.roleSkillId, (map.get(skill.roleSkillId) ?? 0) + hours)
    }
  }

  return [...map.entries()]
    .map(([roleSkillId, availableHours]) => ({
      roleSkillId,
      availableHours: Math.round(availableHours * 10) / 10,
    }))
    .sort((a, b) => b.availableHours - a.availableHours)
}
