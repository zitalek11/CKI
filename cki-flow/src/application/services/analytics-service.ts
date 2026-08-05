import type { UnitOfWork } from '@/application/ports/unit-of-work'
import { calculateRoleDemand, calculateUtilization } from '@/domain/engines/capacity/demand'
import { calculateRoleSupply } from '@/domain/engines/capacity/supply'
import { calculateReleaseReadiness } from '@/domain/engines/release/readiness'
import { DomainError } from '@/domain/model/errors'
import { calculateStoryProgress } from '@/domain/rules/progress'

export class AnalyticsService {
  private readonly uow: UnitOfWork

  constructor(uow: UnitOfWork) {
    this.uow = uow
  }

  async getPulse(productId: string) {
    const db = await this.uow.read()
    const product = db.products.find((item) => item.id === productId)
    if (!product) throw new DomainError('NOT_FOUND', 'Продукт не найден')

    const stories = db.userStories.filter((item) => item.productId === productId)
    const workItems = db.workItems.filter((item) => item.productId === productId)
    const sprint =
      (product.activeSprintId && db.sprints.find((item) => item.id === product.activeSprintId)) ||
      db.sprints.find((item) => item.productId === productId && item.status === 'active')
    const quarter =
      (product.activeQuarterId && db.quarters.find((item) => item.id === product.activeQuarterId)) ||
      db.quarters.find((item) => item.productId === productId && item.status === 'active')

    const doneStories = stories.filter((item) => item.status === 'done').length
    const avgProgress =
      stories.length === 0
        ? 0
        : Math.round(
            stories.reduce((sum, story) => {
              const works = workItems.filter((item) => item.userStoryId === story.id)
              return sum + calculateStoryProgress(works)
            }, 0) / stories.length,
          )

    const employees = db.employees.filter((item) => item.productId === productId)
    const absences = db.absences
      .filter((item) => item.productId === productId)
      .map((item) => ({
        employeeId: item.employeeId,
        startDate: item.startDate,
        endDate: item.endDate,
      }))

    const demand = calculateRoleDemand(workItems)
    const supply = calculateRoleSupply({
      employees,
      employeeSkills: db.employeeSkills,
      periodStart: sprint?.startDate ?? quarter?.startDate ?? '2026-08-01',
      periodEnd: sprint?.endDate ?? quarter?.endDate ?? '2026-08-31',
      absences,
    })
    const roleBars = demand.map((item) => {
      const role = db.roleSkills.find((skill) => skill.id === item.roleSkillId)
      const supplyHours = supply.find((row) => row.roleSkillId === item.roleSkillId)?.availableHours ?? 0
      return {
        code: role?.code ?? '?',
        demandHours: item.hours,
        supplyHours,
        utilization: calculateUtilization(item.hours, supplyHours),
      }
    })
    const bottleneck = [...roleBars].sort((a, b) => b.utilization - a.utilization)[0]

    const totalDemandHours = demand.reduce((sum, item) => sum + item.hours, 0)
    const totalSupplyHours = supply.reduce((sum, item) => sum + item.availableHours, 0)
    const teamUtilization = calculateUtilization(totalDemandHours, totalSupplyHours)

    const overloadedEmployees = employees
      .filter((employee) => employee.status === 'active')
      .map((employee) => {
        const assignedHours = workItems
          .filter(
            (item) =>
              item.assigneeEmployeeId === employee.id &&
              item.status !== 'done' &&
              item.status !== 'cancelled',
          )
          .reduce((sum, item) => sum + item.estimateHours, 0)
        const employeeSupply =
          calculateRoleSupply({
            employees: [employee],
            employeeSkills: db.employeeSkills.filter((skill) => skill.employeeId === employee.id),
            periodStart: sprint?.startDate ?? quarter?.startDate ?? '2026-08-01',
            periodEnd: sprint?.endDate ?? quarter?.endDate ?? '2026-08-31',
            absences,
          }).reduce((sum, row) => sum + row.availableHours, 0) || 1
        const utilization = calculateUtilization(assignedHours, employeeSupply)
        return {
          id: employee.id,
          displayName: employee.displayName,
          demandHours: assignedHours,
          supplyHours: Math.round(employeeSupply * 10) / 10,
          utilization,
        }
      })
      .filter((row) => row.utilization > 1)
      .sort((a, b) => b.utilization - a.utilization)

    const release =
      db.releases.find(
        (item) =>
          item.productId === productId &&
          (item.status === 'in_progress' || item.status === 'code_freeze'),
      ) ?? db.releases.find((item) => item.productId === productId)
    let releaseReadiness = null
    if (release) {
      const memberships = db.releaseMemberships.filter((item) => item.releaseId === release.id)
      const releaseStories = stories.filter((story) =>
        memberships.some((membership) => membership.userStoryId === story.id),
      )
      releaseReadiness = {
        release,
        ...calculateReleaseReadiness({
          memberships,
          stories: releaseStories,
          workItems: workItems.filter((item) =>
            releaseStories.some((story) => story.id === item.userStoryId),
          ),
        }),
      }
    }

    const blocked = workItems.filter((item) => item.status === 'blocked').length
    const blockingDependencies = db.dependencies.filter((dep) => {
      if (dep.productId !== productId || dep.strength !== 'hard') return false
      const toItem = workItems.find((item) => item.id === dep.toId)
      if (!toItem) return false
      return toItem.status !== 'done' && toItem.status !== 'cancelled'
    }).length

    const events = db.events.filter((event) => event.productId === productId).slice(-8).reverse()

    const health =
      (bottleneck?.utilization ?? 0) > 1.2 || blocked > 3 || overloadedEmployees.length > 2
        ? 'off_track'
        : (bottleneck?.utilization ?? 0) > 0.9 || blocked > 0 || overloadedEmployees.length > 0
          ? 'at_risk'
          : 'on_track'

    return {
      health,
      avgProgress,
      doneStories,
      totalStories: stories.length,
      blocked,
      blockingDependencies,
      bottleneck,
      releaseReadiness,
      sprintName: sprint?.name,
      quarterKey: quarter?.key,
      events,
      roleBars,
      teamCapacity: {
        demandHours: totalDemandHours,
        supplyHours: Math.round(totalSupplyHours * 10) / 10,
        utilization: teamUtilization,
      },
      overloadedEmployees,
    }
  }
}
