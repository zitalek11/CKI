import type { UnitOfWork } from '@/application/ports/unit-of-work'
import type { DomainDatabase } from '@/domain/model/database'
import { DomainError } from '@/domain/model/errors'
import { logger } from '@/shared/lib/logger'

export type ExportEnvelope = {
  format: 'cki-flow-db'
  formatVersion: 1
  exportedAt: string
  database: DomainDatabase
}

export class IoService {
  private readonly uow: UnitOfWork

  constructor(uow: UnitOfWork) {
    this.uow = uow
  }

  async exportJson(): Promise<ExportEnvelope> {
    const database = await this.uow.read()
    const envelope: ExportEnvelope = {
      format: 'cki-flow-db',
      formatVersion: 1,
      exportedAt: new Date().toISOString(),
      database,
    }
    logger.info('Database exported', { stories: database.userStories.length }, 'io')
    return envelope
  }

  async importJson(raw: string): Promise<void> {
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      throw new DomainError('VALIDATION', 'Некорректный JSON')
    }

    const envelope = parsed as Partial<ExportEnvelope>
    const db = (envelope.database ?? parsed) as DomainDatabase
    if (!db || db.version !== 1 || !Array.isArray(db.userStories) || !Array.isArray(db.products)) {
      throw new DomainError('VALIDATION', 'Неподдерживаемый или некорректный экспорт CKI Flow')
    }

    await this.uow.replace(db)
    logger.info('Database imported', { stories: db.userStories.length }, 'io')
  }
}
