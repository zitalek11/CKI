import type { UnitOfWork } from '@/application/ports/unit-of-work'
import { calculateRoleDemand, calculateUtilization } from '@/domain/engines/capacity/demand'
import { calculateRoleSupply } from '@/domain/engines/capacity/supply'
import { DomainError } from '@/domain/model/errors'
import { calculateStoryProgress } from '@/domain/rules/progress'

export class QuarterService {
  private readonly uow: UnitOfWork

  constructor(uow: UnitOfWork) {
    this.uow = uow
  }

  async getOverview(productId: string) {
    const db = await this.uow.read()
    const quarter = db.quarters.find((item) => item.productId === productId && item.status === 'active')
    if (!quarter) throw new DomainError('NOT_FOUND', 'Active quarter not found')

    const goals = db.quarterGoals.filter((item) => item.quarterId === quarter.id)
    const initiatives = db.initiatives.filter((item) => item.quarterId === quarter.id)
    const epics = db.epics.filter((epic) =>
      initiatives.some((initiative) => initiative.id === epic.initiativeId),
    )
    const stories = db.userStories.filter((story) => story.productId === productId)
    const workItems = db.workItems.filter((item) => item.productId === productId)

    const demand = calculateRoleDemand(workItems)
    const supply = calculateRoleSupply({
      employees: db.employees.filter((item) => item.productId === productId),
      employeeSkills: db.employeeSkills,
      periodStart: quarter.startDate,
      periodEnd: quarter.endDate,
    })

    const rolePressure = demand.map((item) => {
      const supplyHours = supply.find((row) => row.roleSkillId === item.roleSkillId)?.availableHours ?? 0
      const role = db.roleSkills.find((skill) => skill.id === item.roleSkillId)
      const utilization = calculateUtilization(item.hours, supplyHours)
      return {
        code: role?.code ?? '?',
        demandHours: item.hours,
        supplyHours,
        utilization,
      }
    })

    const maxUtil = rolePressure.reduce((max, row) => Math.max(max, row.utilization || 0), 0)
    const health = maxUtil > 1.2 ? 'off_track' : maxUtil > 0.9 ? 'at_risk' : 'on_track'

    const tree = initiatives.map((initiative) => ({
      initiative,
      epics: epics
        .filter((epic) => epic.initiativeId === initiative.id)
        .map((epic) => {
          const epicStories = stories.filter((story) => story.epicId === epic.id)
          const progress =
            epicStories.length === 0
              ? 0
              : Math.round(
                  epicStories.reduce((sum, story) => {
                    const works = workItems.filter((item) => item.userStoryId === story.id)
                    return sum + calculateStoryProgress(works)
                  }, 0) / epicStories.length,
                )
          return {
            epic,
            storyCount: epicStories.length,
            progress,
          }
        }),
    }))

    return {
      quarter,
      goals,
      health,
      rolePressure,
      tree,
      counts: {
        initiatives: initiatives.length,
        epics: epics.length,
        stories: stories.length,
      },
    }
  }
}
