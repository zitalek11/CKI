import type { ImportDraft, MigrationSourceFormat } from '@/domain/migration/types'

export type MigrationFileInput = {
  fileName: string
  mimeType: string
  bytes: ArrayBuffer
}

/** Format-specific adapter. Engine never depends on PDF/Excel internals. */
export interface MigrationSourceAdapter {
  readonly format: MigrationSourceFormat
  canHandle(input: MigrationFileInput): boolean
  parse(input: MigrationFileInput): Promise<ImportDraft>
}
