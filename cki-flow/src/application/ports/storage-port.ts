import type { DomainDatabase } from '@/domain/model/database'

/** Persistence port — swap LocalStorage ↔ Tauri FS ↔ HTTP without changing services. */
export interface StoragePort {
  load(): Promise<DomainDatabase | null>
  save(db: DomainDatabase): Promise<void>
  clear(): Promise<void>
}
