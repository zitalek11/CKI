import type { UnitOfWork } from '@/application/ports/unit-of-work'
import type { DomainDatabase } from '@/domain/model/database'
import { createDemoDatabase } from '@/infrastructure/seed/demo-seed'
import { logger } from '@/shared/lib/logger'

export class BootstrapService {
  private readonly uow: UnitOfWork

  constructor(uow: UnitOfWork) {
    this.uow = uow
  }

  async ensureReady(options?: { forceSeed?: boolean }): Promise<DomainDatabase> {
    const db = await this.uow.read()
    const empty = db.products.length === 0

    if (options?.forceSeed || empty) {
      const seeded = createDemoDatabase()
      await this.uow.replace(seeded)
      logger.info('Demo database seeded', { product: seeded.products[0]?.key }, 'bootstrap')
      return seeded
    }

    return db
  }
}
