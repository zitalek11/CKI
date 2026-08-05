import type { StoragePort } from '@/application/ports/storage-port'
import type { MutationFn, UnitOfWork } from '@/application/ports/unit-of-work'
import { createEmptyDatabase, type DomainDatabase } from '@/domain/model/database'

export class LocalUnitOfWork implements UnitOfWork {
  private cache: DomainDatabase | null = null
  private readonly storage: StoragePort

  constructor(storage: StoragePort) {
    this.storage = storage
  }

  async read(): Promise<DomainDatabase> {
    if (this.cache) return structuredClone(this.cache)
    const loaded = await this.storage.load()
    this.cache = loaded ?? createEmptyDatabase()
    return structuredClone(this.cache)
  }

  async write(mutate: MutationFn): Promise<DomainDatabase> {
    const current = await this.read()
    const next = mutate(current) ?? current
    this.cache = next
    await this.storage.save(next)
    return structuredClone(next)
  }

  async replace(db: DomainDatabase): Promise<void> {
    this.cache = db
    await this.storage.save(db)
  }

  async reset(): Promise<DomainDatabase> {
    const empty = createEmptyDatabase()
    this.cache = empty
    await this.storage.clear()
    await this.storage.save(empty)
    return structuredClone(empty)
  }
}
