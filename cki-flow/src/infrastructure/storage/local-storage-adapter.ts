import type { StoragePort } from '@/application/ports/storage-port'
import { migrateDatabase, type DomainDatabase } from '@/domain/model/database'
import { logger } from '@/shared/lib/logger'

const STORAGE_KEY = 'cki-flow.domain.db.v1'

export class LocalStorageAdapter implements StoragePort {
  private readonly key: string

  constructor(key = STORAGE_KEY) {
    this.key = key
  }

  async load(): Promise<DomainDatabase | null> {
    try {
      const raw = localStorage.getItem(this.key)
      if (!raw) return null
      const parsed = JSON.parse(raw) as unknown
      const migrated = migrateDatabase(parsed)
      return migrated
    } catch (error) {
      logger.error('Failed to load local database', error, 'storage')
      throw error
    }
  }

  async save(db: DomainDatabase): Promise<void> {
    const normalized = migrateDatabase(db)
    localStorage.setItem(this.key, JSON.stringify(normalized))
    logger.debug(
      'Database saved',
      { version: normalized.version, stories: normalized.userStories.length },
      'storage',
    )
  }

  async clear(): Promise<void> {
    localStorage.removeItem(this.key)
  }
}
