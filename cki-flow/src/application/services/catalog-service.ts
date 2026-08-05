import type { UnitOfWork } from '@/application/ports/unit-of-work'
import type { EstimationTemplate, WorkflowTemplateVersion } from '@/domain/model/entities'
import { DomainError } from '@/domain/model/errors'
import { createId } from '@/domain/model/ids'
import { touchSystemFields } from '@/domain/model/system'
import { logger } from '@/shared/lib/logger'

export type UpdateStageTemplateInput = {
  workflowTemplateVersionId: string
  stageKey: string
  descriptionTemplate?: string
  goalTemplate?: string
  expectedResultTemplate?: string
  defaultEstimateHours?: number
  actor?: string
}

export type UpdateEstimationLineInput = {
  estimationTemplateId: string
  lineId: string
  estimateHours: number
  actor?: string
}

export class CatalogService {
  private readonly uow: UnitOfWork

  constructor(uow: UnitOfWork) {
    this.uow = uow
  }

  async getWorkspaceSummary() {
    const db = await this.uow.read()
    const product = db.products[0]
    if (!product) {
      throw new DomainError('NOT_FOUND', 'В рабочем пространстве нет продукта')
    }

    const quarter =
      (product.activeQuarterId && db.quarters.find((item) => item.id === product.activeQuarterId)) ||
      db.quarters.find((item) => item.productId === product.id && item.status === 'active')
    const sprint =
      (product.activeSprintId && db.sprints.find((item) => item.id === product.activeSprintId)) ||
      db.sprints.find((item) => item.productId === product.id && item.status === 'active')
    const initiative = db.initiatives.find((item) => item.productId === product.id)
    const epic = db.epics.find((item) => item.productId === product.id)

    return {
      product,
      quarter,
      sprint,
      initiative,
      epic,
      counts: {
        stories: db.userStories.filter((item) => item.productId === product.id).length,
        workItems: db.workItems.filter((item) => item.productId === product.id).length,
        templates: db.workflowTemplates.filter((item) => item.productId === product.id).length,
        employees: db.employees.filter((item) => item.productId === product.id).length,
        dependencies: db.dependencies.filter((item) => item.productId === product.id).length,
      },
    }
  }

  async listTemplates(productId: string) {
    const db = await this.uow.read()
    return db.workflowTemplates
      .filter((template) => template.productId === productId)
      .map((template) => {
        const version = db.workflowTemplateVersions.find(
          (item) => item.id === template.currentPublishedVersionId,
        )
        return {
          ...template,
          stageCount: version?.stages.length ?? 0,
          dependencyRuleCount: version?.dependencyRules.length ?? 0,
          versionNumber: version?.versionNumber,
        }
      })
  }

  async getTemplateVersion(templateId: string): Promise<WorkflowTemplateVersion | undefined> {
    const db = await this.uow.read()
    const template = db.workflowTemplates.find((item) => item.id === templateId)
    if (!template) return undefined
    return db.workflowTemplateVersions.find((item) => item.id === template.currentPublishedVersionId)
  }

  async updateStageTemplate(input: UpdateStageTemplateInput): Promise<void> {
    const actor = input.actor ?? 'pm'
    await this.uow.write((db) => {
      const version = db.workflowTemplateVersions.find(
        (item) => item.id === input.workflowTemplateVersionId,
      )
      if (!version) throw new DomainError('NOT_FOUND', 'Версия шаблона процесса не найдена')

      const stage = version.stages.find((item) => item.key === input.stageKey)
      if (!stage) throw new DomainError('NOT_FOUND', 'Этап шаблона не найден')

      if (input.descriptionTemplate !== undefined) stage.descriptionTemplate = input.descriptionTemplate
      if (input.goalTemplate !== undefined) stage.goalTemplate = input.goalTemplate
      if (input.expectedResultTemplate !== undefined) {
        stage.expectedResultTemplate = input.expectedResultTemplate
      }
      if (input.defaultEstimateHours !== undefined) {
        if (input.defaultEstimateHours < 0) {
          throw new DomainError('VALIDATION', 'Оценка часов не может быть отрицательной')
        }
        stage.defaultEstimateHours = input.defaultEstimateHours
      }

      Object.assign(version, touchSystemFields(version, actor))
    })
    logger.info('Workflow stage template updated', input, 'catalog')
  }

  async listEstimationTemplates(productId: string): Promise<EstimationTemplate[]> {
    const db = await this.uow.read()
    return db.estimationTemplates.filter((item) => item.productId === productId)
  }

  async updateEstimationLine(input: UpdateEstimationLineInput): Promise<void> {
    const actor = input.actor ?? 'pm'
    if (input.estimateHours < 0) {
      throw new DomainError('VALIDATION', 'Оценка часов не может быть отрицательной')
    }
    await this.uow.write((db) => {
      const template = db.estimationTemplates.find((item) => item.id === input.estimationTemplateId)
      if (!template) throw new DomainError('NOT_FOUND', 'Шаблон оценки не найден')
      const line = template.lines.find((item) => item.id === input.lineId)
      if (!line) throw new DomainError('NOT_FOUND', 'Строка шаблона оценки не найдена')
      line.estimateHours = input.estimateHours
      Object.assign(template, touchSystemFields(template, actor))
    })
    logger.info('Estimation template line updated', input, 'catalog')
  }

  async createEstimationTemplate(params: {
    productId: string
    code: string
    name: string
    description?: string
    lines?: EstimationTemplate['lines']
    actor?: string
  }): Promise<EstimationTemplate> {
    const actor = params.actor ?? 'pm'
    const code = params.code.trim().toUpperCase()
    const name = params.name.trim()
    if (!code || !name) throw new DomainError('VALIDATION', 'Код и название шаблона обязательны')

    let created: EstimationTemplate | undefined
    await this.uow.write((db) => {
      if (
        db.estimationTemplates.some(
          (item) => item.productId === params.productId && item.code === code,
        )
      ) {
        throw new DomainError('CONFLICT', `Шаблон оценки с кодом ${code} уже существует`)
      }
      const template: EstimationTemplate = {
        id: createId(),
        productId: params.productId as EstimationTemplate['productId'],
        code,
        name,
        description: params.description,
        isDefault: db.estimationTemplates.filter((item) => item.productId === params.productId)
          .length === 0,
        lines: params.lines ?? [],
        ...touchSystemFields(undefined, actor),
      }
      db.estimationTemplates.push(template)
      if (template.isDefault) {
        const product = db.products.find((item) => item.id === params.productId)
        if (product) product.defaultEstimationTemplateId = template.id
      }
      created = template
    })
    if (!created) throw new DomainError('CONFLICT', 'Шаблон оценки не был создан')
    return created
  }

  async copyEstimationTemplate(params: {
    productId: string
    sourceId: string
    code: string
    name: string
    actor?: string
  }): Promise<EstimationTemplate> {
    const actor = params.actor ?? 'pm'
    let created: EstimationTemplate | undefined
    await this.uow.write((db) => {
      const source = db.estimationTemplates.find(
        (item) => item.id === params.sourceId && item.productId === params.productId,
      )
      if (!source) throw new DomainError('NOT_FOUND', 'Исходный шаблон оценки не найден')
      const code = params.code.trim().toUpperCase()
      if (
        db.estimationTemplates.some(
          (item) => item.productId === params.productId && item.code === code,
        )
      ) {
        throw new DomainError('CONFLICT', `Шаблон оценки с кодом ${code} уже существует`)
      }
      const template: EstimationTemplate = {
        id: createId(),
        productId: source.productId,
        code,
        name: params.name.trim() || `${source.name} (копия)`,
        description: source.description,
        isDefault: false,
        lines: source.lines.map((line) => ({ ...line, id: createId() })),
        ...touchSystemFields(undefined, actor),
      }
      db.estimationTemplates.push(template)
      created = template
    })
    if (!created) throw new DomainError('CONFLICT', 'Шаблон оценки не был скопирован')
    return created
  }

  async deleteEstimationTemplate(params: {
    productId: string
    templateId: string
    actor?: string
  }): Promise<void> {
    await this.uow.write((db) => {
      const template = db.estimationTemplates.find(
        (item) => item.id === params.templateId && item.productId === params.productId,
      )
      if (!template) throw new DomainError('NOT_FOUND', 'Шаблон оценки не найден')
      db.estimationTemplates = db.estimationTemplates.filter((item) => item.id !== template.id)
      const product = db.products.find((item) => item.id === params.productId)
      if (product?.defaultEstimationTemplateId === template.id) {
        const next = db.estimationTemplates.find((item) => item.productId === params.productId)
        product.defaultEstimationTemplateId = next?.id
        if (next) next.isDefault = true
      }
    })
    logger.info('Estimation template deleted', params, 'catalog')
  }

  async setDefaultEstimationTemplate(params: {
    productId: string
    templateId: string
    actor?: string
  }): Promise<void> {
    const actor = params.actor ?? 'pm'
    await this.uow.write((db) => {
      const template = db.estimationTemplates.find(
        (item) => item.id === params.templateId && item.productId === params.productId,
      )
      if (!template) throw new DomainError('NOT_FOUND', 'Шаблон оценки не найден')
      for (const item of db.estimationTemplates) {
        if (item.productId !== params.productId) continue
        item.isDefault = item.id === template.id
        Object.assign(item, touchSystemFields(item, actor))
      }
      const product = db.products.find((item) => item.id === params.productId)
      if (product) {
        product.defaultEstimationTemplateId = template.id
        product.updatedAt = new Date().toISOString()
        product.updatedBy = actor
      }
    })
    logger.info('Default estimation template set', params, 'catalog')
  }
}
