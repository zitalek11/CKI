import type { StoragePort } from '@/application/ports/storage-port'
import type { DomainDatabase } from '@/domain/model/database'
import { DomainError } from '@/domain/model/errors'
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
      const parsed = JSON.parse(raw) as DomainDatabase
      if (parsed.version !== 1) {
        throw new DomainError('VALIDATION', `Unsupported database version: ${String(parsed.version)}`)
      }
      return parsed
    } catch (error) {
      logger.error('Failed to load local database', error, 'storage')
      throw error
    }
  }

  async save(db: DomainDatabase): Promise<void> {
    localStorage.setItem(this.key, JSON.stringify(db))
    logger.debug('Database saved', { version: db.version, stories: db.userStories.length }, 'storage')
  }

  async clear(): Promise<void> {
    localStorage.removeItem(this.key)
  }
}
