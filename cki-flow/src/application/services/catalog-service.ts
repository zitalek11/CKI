import type { UnitOfWork } from '@/application/ports/unit-of-work'
import { DomainError } from '@/domain/model/errors'

export class CatalogService {
  private readonly uow: UnitOfWork

  constructor(uow: UnitOfWork) {
    this.uow = uow
  }

  async getWorkspaceSummary() {
    const db = await this.uow.read()
    const product = db.products[0]
    if (!product) {
      throw new DomainError('NOT_FOUND', 'No product in workspace')
    }

    const quarter = db.quarters.find((item) => item.productId === product.id && item.status === 'active')
    const sprint = db.sprints.find((item) => item.productId === product.id && item.status === 'active')
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
}
