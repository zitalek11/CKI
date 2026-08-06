import type { UnitOfWork } from '@/application/ports/unit-of-work'
import { calculateRoleDemand, calculateUtilization } from '@/domain/engines/capacity/demand'
import { calculateRoleSupply } from '@/domain/engines/capacity/supply'
import type { DomainDatabase } from '@/domain/model/database'
import type { Quarter } from '@/domain/model/entities'
import { QuarterStatus } from '@/domain/model/enums'
import { DomainError } from '@/domain/model/errors'
import { createId } from '@/domain/model/ids'
import { formatQuarterKey } from '@/domain/model/keys'
import { calculateStoryProgress } from '@/domain/rules/progress'
import { touchSystemFields } from '@/domain/model/system'
import { logger } from '@/shared/lib/logger'

export type CreateQuarterInput = {
  productId: string
  year: number
  index: 1 | 2 | 3 | 4
  startDate: string
  endDate: string
  actor?: string
}

function resolveActiveQuarter(db: DomainDatabase, productId: string): Quarter | undefined {
  const product = db.products.find((item) => item.id === productId)
  if (product?.activeQuarterId) {
    const bySetting = db.quarters.find((item) => item.id === product.activeQuarterId)
    if (bySetting) return bySetting
  }
  return db.quarters.find((item) => item.productId === productId && item.status === 'active')
}

export class QuarterService {
  private readonly uow: UnitOfWork

  constructor(uow: UnitOfWork) {
    this.uow = uow
  }

  async listAll(productId: string): Promise<Quarter[]> {
    const db = await this.uow.read()
    return db.quarters
      .filter((item) => item.productId === productId)
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
  }

  async create(input: CreateQuarterInput): Promise<Quarter> {
    const actor = input.actor ?? 'pm'
    if (input.endDate < input.startDate) {
      throw new DomainError('VALIDATION', 'Дата окончания квартала раньше даты начала')
    }

    let created: Quarter | undefined
    await this.uow.write((db) => {
      const product = db.products.find((item) => item.id === input.productId)
      if (!product) throw new DomainError('NOT_FOUND', 'Продукт не найден')

      const quarter: Quarter = {
        id: createId(),
        productId: input.productId as Quarter['productId'],
        key: formatQuarterKey(input.year, input.index),
        year: input.year,
        index: input.index,
        startDate: input.startDate,
        endDate: input.endDate,
        status: QuarterStatus.Draft,
        ...touchSystemFields(undefined, actor),
      }
      db.quarters.push(quarter)
      created = quarter
    })

    if (!created) throw new DomainError('CONFLICT', 'Квартал не был создан')
    logger.info('Quarter created', { id: created.id, key: created.key }, 'quarter')
    return created
  }

  async activate(params: { productId: string; quarterId: string; actor?: string }): Promise<void> {
    const actor = params.actor ?? 'pm'
    await this.uow.write((db) => {
      const quarter = db.quarters.find(
        (item) => item.id === params.quarterId && item.productId === params.productId,
      )
      if (!quarter) throw new DomainError('NOT_FOUND', 'Квартал не найден')

      const product = db.products.find((item) => item.id === params.productId)
      if (!product) throw new DomainError('NOT_FOUND', 'Продукт не найден')

      for (const other of db.quarters) {
        if (other.id === quarter.id) continue
        if (other.productId !== params.productId) continue
        if (other.status === QuarterStatus.Active) {
          other.status = QuarterStatus.Closed
          Object.assign(other, touchSystemFields(other, actor))
        }
      }

      quarter.status = QuarterStatus.Active
      Object.assign(quarter, touchSystemFields(quarter, actor))
      product.activeQuarterId = quarter.id as typeof product.activeQuarterId
      product.updatedAt = new Date().toISOString()
      product.updatedBy = actor

      db.events.push({
        id: createId(),
        productId: quarter.productId,
        type: 'QuarterActivated',
        aggregateType: 'quarter',
        aggregateId: quarter.id,
        occurredAt: new Date().toISOString(),
        actor,
        payload: { key: quarter.key },
      })
    })
    logger.info('Quarter activated', { quarterId: params.quarterId }, 'quarter')
  }

  async archive(params: { productId: string; quarterId: string; actor?: string }): Promise<void> {
    const actor = params.actor ?? 'pm'
    await this.uow.write((db) => {
      const quarter = db.quarters.find(
        (item) => item.id === params.quarterId && item.productId === params.productId,
      )
      if (!quarter) throw new DomainError('NOT_FOUND', 'Квартал не найден')

      if (quarter.status === QuarterStatus.Active) {
        quarter.status = QuarterStatus.Closed
      }
      quarter.archivedAt = new Date().toISOString()
      Object.assign(quarter, touchSystemFields(quarter, actor))

      const product = db.products.find((item) => item.id === params.productId)
      if (product?.activeQuarterId === quarter.id) {
        product.activeQuarterId = undefined
        product.updatedAt = new Date().toISOString()
        product.updatedBy = actor
      }
    })
    logger.info('Quarter archived', { quarterId: params.quarterId }, 'quarter')
  }

  async carryOverIncomplete(params: {
    productId: string
    fromQuarterId: string
    toQuarterId: string
    actor?: string
  }): Promise<{ storiesMoved: number }> {
    const actor = params.actor ?? 'pm'
    let storiesMoved = 0

    await this.uow.write((db) => {
      const source = db.quarters.find(
        (item) => item.id === params.fromQuarterId && item.productId === params.productId,
      )
      const target = db.quarters.find(
        (item) => item.id === params.toQuarterId && item.productId === params.productId,
      )
      if (!source) throw new DomainError('NOT_FOUND', 'Исходный квартал не найден')
      if (!target) throw new DomainError('NOT_FOUND', 'Целевой квартал не найден')

      for (const story of db.userStories) {
        if (story.productId !== params.productId) continue
        if (story.targetQuarterId !== source.id) continue
        if (
          story.status === 'done' ||
          story.status === 'cancelled' ||
          story.status === 'archived'
        ) {
          continue
        }
        story.targetQuarterId = target.id as typeof story.targetQuarterId
        Object.assign(story, touchSystemFields(story, actor))
        storiesMoved += 1
      }

      db.events.push({
        id: createId(),
        productId: source.productId,
        type: 'QuarterCarryOver',
        aggregateType: 'quarter',
        aggregateId: target.id,
        occurredAt: new Date().toISOString(),
        actor,
        payload: {
          fromQuarterId: source.id,
          toQuarterId: target.id,
          storiesMoved,
        },
      })
    })

    logger.info('Quarter carry-over completed', { ...params, storiesMoved }, 'quarter')
    return { storiesMoved }
  }

  async copyStructure(params: {
    productId: string
    sourceQuarterId: string
    targetQuarterId: string
    actor?: string
  }): Promise<{ goalsCopied: number }> {
    const actor = params.actor ?? 'pm'
    let goalsCopied = 0

    await this.uow.write((db) => {
      const source = db.quarters.find(
        (item) => item.id === params.sourceQuarterId && item.productId === params.productId,
      )
      const target = db.quarters.find(
        (item) => item.id === params.targetQuarterId && item.productId === params.productId,
      )
      if (!source) throw new DomainError('NOT_FOUND', 'Исходный квартал не найден')
      if (!target) throw new DomainError('NOT_FOUND', 'Целевой квартал не найден')

      const sourceGoals = db.quarterGoals.filter((item) => item.quarterId === source.id)
      for (const goal of sourceGoals) {
        db.quarterGoals.push({
          id: createId(),
          quarterId: target.id,
          productId: params.productId as typeof goal.productId,
          title: goal.title,
          statement: goal.statement,
          ownerEmployeeId: goal.ownerEmployeeId,
          status: 'draft',
          targetValue: goal.targetValue,
          currentValue: 0,
          ...touchSystemFields(undefined, actor),
        })
        goalsCopied += 1
      }
    })

    logger.info('Quarter structure copied', { ...params, goalsCopied }, 'quarter')
    return { goalsCopied }
  }

  async getOverview(productId: string) {
    const db = await this.uow.read()
    const quarter = resolveActiveQuarter(db, productId)
    if (!quarter) throw new DomainError('NOT_FOUND', 'Активный квартал не найден')

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
      absences: db.absences
        .filter((item) => item.productId === productId)
        .map((item) => ({
          employeeId: item.employeeId,
          startDate: item.startDate,
          endDate: item.endDate,
        })),
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
