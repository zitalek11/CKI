import type { StoragePort } from '@/application/ports/storage-port'
import type { DomainDatabase } from '@/domain/model/database'

export class MemoryStorage implements StoragePort {
  private data: DomainDatabase | null = null

  async load(): Promise<DomainDatabase | null> {
    return this.data ? structuredClone(this.data) : null
  }

  async save(db: DomainDatabase): Promise<void> {
    this.data = structuredClone(db)
  }

  async clear(): Promise<void> {
    this.data = null
  }
}
