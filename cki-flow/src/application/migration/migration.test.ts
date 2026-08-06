import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { MigrationApplyService } from '@/application/migration/apply-service'
import { MigrationEngine } from '@/application/migration/engine'
import { createMigrationAdapters } from '@/infrastructure/migration/adapters'
import { createDemoDatabase } from '@/infrastructure/seed/demo-seed'
import { MemoryStorage } from '@/infrastructure/storage/memory-storage'
import { LocalUnitOfWork } from '@/infrastructure/repositories/local-unit-of-work'
import { validateImportDraft } from '@/domain/migration/validate-draft'
import { applyMappingToDraft, createMappingRule } from '@/domain/migration/mapping'

describe('Migration Wizard', () => {
  it('parses sample cki-board-export JSON and builds a valid draft', async () => {
    const samplePath = resolve(process.cwd(), 'public/fixtures/sample-cki-board.json')
    const bytes = readFileSync(samplePath)
    const engine = new MigrationEngine(createMigrationAdapters())
    const result = await engine.analyze(
      {
        fileName: 'sample-cki-board.json',
        mimeType: 'application/json',
        bytes: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
      },
      { mode: 'full', mappingRules: { rules: [] } },
    )

    expect(result.draft.sourceFormat).toBe('json')
    expect(result.summary.stories).toBe(10)
    expect(result.summary.quarters).toBe(3)
    expect(result.summary.epics).toBe(4)
    expect(result.summary.initiatives).toBe(3)
    expect(result.validation.ok).toBe(true)
    // Role aliases БА/ВР resolved via default map
    expect(result.draft.stories.some((story) => story.assigneeHints?.includes('BA'))).toBe(true)
    expect(result.draft.stories.some((story) => story.assigneeHints?.includes('BE'))).toBe(true)
  })

  it('persists mapping rules conceptually via applyMappingToDraft', () => {
    const draft = {
      sourceFormat: 'json' as const,
      sourceFileName: 'x.json',
      analyzedAt: new Date().toISOString(),
      people: [],
      quarters: [],
      sprints: [],
      initiatives: [],
      epics: [],
      stories: [
        {
          tempId: '1',
          confidence: 'high' as const,
          title: 'Demo',
          stageHints: ['К выполнению'],
          assigneeHints: ['БА'],
        },
      ],
      dependencies: [],
      releases: [],
      mappingRules: [],
      rawNotes: [],
    }
    const rules = [createMappingRule('role', 'БА', 'BA')]
    const mapped = applyMappingToDraft(draft, { rules })
    expect(mapped.stories[0]?.status).toBe('ready')
    expect(mapped.stories[0]?.assigneeHints?.[0]).toBe('BA')
  })

  it('full migration creates stories with generated work items', async () => {
    const samplePath = resolve(process.cwd(), 'public/fixtures/sample-cki-board.json')
    const bytes = readFileSync(samplePath)
    const engine = new MigrationEngine(createMigrationAdapters())
    const analyzed = await engine.analyze(
      {
        fileName: 'sample-cki-board.json',
        mimeType: 'application/json',
        bytes: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
      },
      { mode: 'full', mappingRules: { rules: [] } },
    )

    const uow = new LocalUnitOfWork(new MemoryStorage())
    await uow.replace(createDemoDatabase())
    const dbBefore = await uow.read()
    const productId = dbBefore.products[0]!.id

    const apply = new MigrationApplyService(uow)
    const { journal } = await apply.apply({
      productId,
      draft: analyzed.draft,
      mode: 'full',
    })

    expect(journal.imported.stories).toBe(10)
    expect(journal.imported.workItems).toBeGreaterThan(10)
    expect(journal.imported.quarters).toBe(3)
    expect(journal.warnings.length).toBeGreaterThan(0)

    const db = await uow.read()
    expect(db.userStories.filter((item) => item.productId === productId)).toHaveLength(10)
    expect(db.workflowTemplates.length).toBeGreaterThan(0)
    expect(validateImportDraft(analyzed.draft).ok).toBe(true)
  })

  it('update mode reports new stories as diffs', async () => {
    const uow = new LocalUnitOfWork(new MemoryStorage())
    await uow.replace(createDemoDatabase())
    const db = await uow.read()
    const productId = db.products[0]!.id

    const draft = {
      sourceFormat: 'json' as const,
      sourceFileName: 'x.json',
      analyzedAt: new Date().toISOString(),
      people: [],
      quarters: [],
      sprints: [],
      initiatives: [],
      epics: [{ tempId: 'e1', confidence: 'high' as const, key: 'EPIC-NEW', title: 'New' }],
      stories: [
        {
          tempId: 's1',
          confidence: 'high' as const,
          key: 'CKI-999',
          title: 'Brand new story',
          status: 'ready' as const,
        },
      ],
      dependencies: [],
      releases: [],
      mappingRules: [],
      rawNotes: [],
    }

    const apply = new MigrationApplyService(uow)
    const diffs = await apply.previewDiffs(productId, draft)
    expect(diffs.some((item) => item.key === 'CKI-999' && item.after.includes('новая'))).toBe(
      true,
    )
    expect(diffs.some((item) => item.key === 'EPIC-NEW')).toBe(true)
  })
})
