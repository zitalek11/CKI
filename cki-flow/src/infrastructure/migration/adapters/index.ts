import type { MigrationSourceAdapter } from '@/application/migration/ports'
import { JsonBoardAdapter } from './json-adapter'
import { PdfBoardAdapter } from './pdf-adapter'

/**
 * Registered source adapters for the Migration Engine.
 * Future formats (Excel, CSV, Miro, Jira, Notion, Azure DevOps) plug in here
 * without changing the engine.
 */
export function createMigrationAdapters(): MigrationSourceAdapter[] {
  return [new JsonBoardAdapter(), new PdfBoardAdapter()]
}
