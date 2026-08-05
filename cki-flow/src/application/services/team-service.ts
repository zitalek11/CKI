import type { UnitOfWork } from '@/application/ports/unit-of-work'
import type { Absence, AbsenceKind, Employee } from '@/domain/model/entities'
import { DomainError } from '@/domain/model/errors'
import { createId } from '@/domain/model/ids'
import { touchSystemFields } from '@/domain/model/system'
import { logger } from '@/shared/lib/logger'

export type CreateEmployeeInput = {
  productId: string
  displayName: string
  email?: string
  jobTitle?: string
  defaultTeamId?: string
  color?: string
  hoursPerDay?: number
  workDaysPerWeek?: number
  maxLoadPercent?: number
  productAllocationPercent?: number
  notes?: string
  actor?: string
}

export type UpdateEmployeeInput = {
  employeeId: string
  displayName?: string
  email?: string
  jobTitle?: string
  defaultTeamId?: string
  color?: string
  hoursPerDay?: number
  workDaysPerWeek?: number
  maxLoadPercent?: number
  productAllocationPercent?: number
  notes?: string
  status?: 'active' | 'inactive'
  actor?: string
}

export type AddAbsenceInput = {
  productId: string
  employeeId: string
  kind: AbsenceKind
  startDate: string
  endDate: string
  note?: string
  actor?: string
}

export class TeamService {
  private readonly uow: UnitOfWork

  constructor(uow: UnitOfWork) {
    this.uow = uow
  }

  async listEmployees(productId: string): Promise<Employee[]> {
    const db = await this.uow.read()
    return db.employees
      .filter((item) => item.productId === productId)
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
  }

  async createEmployee(input: CreateEmployeeInput): Promise<Employee> {
    const actor = input.actor ?? 'pm'
    const displayName = input.displayName.trim()
    if (!displayName) {
      throw new DomainError('VALIDATION', 'Имя сотрудника обязательно')
    }

    let created: Employee | undefined
    await this.uow.write((db) => {
      const product = db.products.find((item) => item.id === input.productId)
      if (!product) {
        throw new DomainError('NOT_FOUND', 'Продукт не найден', { productId: input.productId })
      }

      const hoursPerDay = input.hoursPerDay ?? 8
      const workDaysPerWeek = input.workDaysPerWeek ?? 5

      const employee: Employee = {
        id: createId(),
        productId: product.id,
        displayName,
        email: input.email,
        jobTitle: input.jobTitle,
        defaultTeamId: input.defaultTeamId as Employee['defaultTeamId'],
        color: input.color,
        hoursPerDay,
        workDaysPerWeek,
        weeklyHours: hoursPerDay * workDaysPerWeek,
        productAllocationPercent: input.productAllocationPercent ?? 100,
        maxLoadPercent: input.maxLoadPercent ?? 100,
        notes: input.notes,
        status: 'active',
        ...touchSystemFields(undefined, actor),
      }
      db.employees.push(employee)
      created = employee
    })

    if (!created) throw new DomainError('CONFLICT', 'Сотрудник не был создан')
    logger.info('Employee created', { id: created.id, name: created.displayName }, 'team')
    return created
  }

  async updateEmployee(input: UpdateEmployeeInput): Promise<Employee> {
    const actor = input.actor ?? 'pm'
    let updated: Employee | undefined

    await this.uow.write((db) => {
      const employee = db.employees.find((item) => item.id === input.employeeId)
      if (!employee) throw new DomainError('NOT_FOUND', 'Сотрудник не найден')

      if (input.displayName !== undefined) {
        const trimmed = input.displayName.trim()
        if (!trimmed) throw new DomainError('VALIDATION', 'Имя сотрудника обязательно')
        employee.displayName = trimmed
      }
      if (input.email !== undefined) employee.email = input.email
      if (input.jobTitle !== undefined) employee.jobTitle = input.jobTitle
      if (input.defaultTeamId !== undefined) {
        employee.defaultTeamId = input.defaultTeamId as Employee['defaultTeamId']
      }
      if (input.color !== undefined) employee.color = input.color
      if (input.notes !== undefined) employee.notes = input.notes
      if (input.status !== undefined) employee.status = input.status
      if (input.productAllocationPercent !== undefined) {
        employee.productAllocationPercent = input.productAllocationPercent
      }
      if (input.maxLoadPercent !== undefined) employee.maxLoadPercent = input.maxLoadPercent
      if (input.hoursPerDay !== undefined) employee.hoursPerDay = input.hoursPerDay
      if (input.workDaysPerWeek !== undefined) employee.workDaysPerWeek = input.workDaysPerWeek
      if (input.hoursPerDay !== undefined || input.workDaysPerWeek !== undefined) {
        employee.weeklyHours = employee.hoursPerDay * employee.workDaysPerWeek
      }

      Object.assign(employee, touchSystemFields(employee, actor))
      updated = employee
    })

    if (!updated) throw new DomainError('CONFLICT', 'Сотрудник не был обновлён')
    return updated
  }

  async deactivateEmployee(params: { employeeId: string; actor?: string }): Promise<void> {
    const actor = params.actor ?? 'pm'
    await this.uow.write((db) => {
      const employee = db.employees.find((item) => item.id === params.employeeId)
      if (!employee) throw new DomainError('NOT_FOUND', 'Сотрудник не найден')
      employee.status = 'inactive'
      Object.assign(employee, touchSystemFields(employee, actor))
    })
    logger.info('Employee deactivated', { id: params.employeeId }, 'team')
  }

  async deleteEmployee(params: { employeeId: string }): Promise<void> {
    await this.uow.write((db) => {
      const employee = db.employees.find((item) => item.id === params.employeeId)
      if (!employee) throw new DomainError('NOT_FOUND', 'Сотрудник не найден')

      const hasAssignedWork = db.workItems.some(
        (item) => item.assigneeEmployeeId === params.employeeId,
      )
      if (hasAssignedWork) {
        throw new DomainError(
          'PRECONDITION',
          'Нельзя удалить сотрудника — на него назначены задачи. Сначала деактивируйте его.',
        )
      }

      db.employees = db.employees.filter((item) => item.id !== params.employeeId)
      db.employeeSkills = db.employeeSkills.filter((item) => item.employeeId !== params.employeeId)
      db.absences = db.absences.filter((item) => item.employeeId !== params.employeeId)
    })
    logger.info('Employee deleted', { id: params.employeeId }, 'team')
  }

  async listAbsences(productId: string, employeeId?: string): Promise<Absence[]> {
    const db = await this.uow.read()
    return db.absences
      .filter((item) => item.productId === productId && (!employeeId || item.employeeId === employeeId))
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
  }

  async addAbsence(input: AddAbsenceInput): Promise<Absence> {
    const actor = input.actor ?? 'pm'
    if (input.endDate < input.startDate) {
      throw new DomainError('VALIDATION', 'Дата окончания отсутствия раньше даты начала')
    }

    let created: Absence | undefined
    await this.uow.write((db) => {
      const employee = db.employees.find((item) => item.id === input.employeeId)
      if (!employee) throw new DomainError('NOT_FOUND', 'Сотрудник не найден')

      const absence: Absence = {
        id: createId(),
        productId: input.productId as Absence['productId'],
        employeeId: input.employeeId as Absence['employeeId'],
        kind: input.kind,
        startDate: input.startDate,
        endDate: input.endDate,
        note: input.note,
        ...touchSystemFields(undefined, actor),
      }
      db.absences.push(absence)
      created = absence
    })

    if (!created) throw new DomainError('CONFLICT', 'Отсутствие не было добавлено')
    return created
  }

  async removeAbsence(params: { absenceId: string }): Promise<void> {
    await this.uow.write((db) => {
      const exists = db.absences.some((item) => item.id === params.absenceId)
      if (!exists) throw new DomainError('NOT_FOUND', 'Запись об отсутствии не найдена')
      db.absences = db.absences.filter((item) => item.id !== params.absenceId)
    })
  }
}
