import type { DomainDatabase } from '@/domain/model/database'

export type MutationFn = (db: DomainDatabase) => void | DomainDatabase

export interface UnitOfWork {
  read(): Promise<DomainDatabase>
  write(mutate: MutationFn): Promise<DomainDatabase>
  replace(db: DomainDatabase): Promise<void>
  reset(): Promise<DomainDatabase>
}
