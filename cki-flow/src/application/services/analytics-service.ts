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
    const sprint = db.sprints.find((item) => item.productId === productId && item.status === 'active')
    const quarter = db.quarters.find((item) => item.productId === productId && item.status === 'active')

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

    const demand = calculateRoleDemand(workItems)
    const supply = calculateRoleSupply({
      employees: db.employees.filter((item) => item.productId === productId),
      employeeSkills: db.employeeSkills,
      periodStart: sprint?.startDate ?? quarter?.startDate ?? '2026-08-01',
      periodEnd: sprint?.endDate ?? quarter?.endDate ?? '2026-08-31',
    })
    const bottleneck = demand
      .map((item) => {
        const supplyHours = supply.find((row) => row.roleSkillId === item.roleSkillId)?.availableHours ?? 0
        const role = db.roleSkills.find((skill) => skill.id === item.roleSkillId)
        return {
          code: role?.code ?? '?',
          utilization: calculateUtilization(item.hours, supplyHours),
          demandHours: item.hours,
          supplyHours,
        }
      })
      .sort((a, b) => b.utilization - a.utilization)[0]

    const release = db.releases.find((item) => item.productId === productId)
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
    const events = db.events.filter((event) => event.productId === productId).slice(-8).reverse()

    const health =
      (bottleneck?.utilization ?? 0) > 1.2 || blocked > 3
        ? 'off_track'
        : (bottleneck?.utilization ?? 0) > 0.9 || blocked > 0
          ? 'at_risk'
          : 'on_track'

    return {
      health,
      avgProgress,
      doneStories,
      totalStories: stories.length,
      blocked,
      bottleneck,
      releaseReadiness,
      sprintName: sprint?.name,
      quarterKey: quarter?.key,
      events,
      roleBars: demand.map((item) => {
        const role = db.roleSkills.find((skill) => skill.id === item.roleSkillId)
        const supplyHours = supply.find((row) => row.roleSkillId === item.roleSkillId)?.availableHours ?? 0
        return {
          code: role?.code ?? '?',
          demandHours: item.hours,
          supplyHours,
          utilization: calculateUtilization(item.hours, supplyHours),
        }
      }),
    }
  }
}
