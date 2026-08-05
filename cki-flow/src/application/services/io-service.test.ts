import { describe, expect, it } from 'vitest'
import { BootstrapService } from '@/application/services/bootstrap-service'
import { IoService } from '@/application/services/io-service'
import { LocalUnitOfWork } from '@/infrastructure/repositories/local-unit-of-work'
import { MemoryStorage } from '@/infrastructure/storage/memory-storage'

describe('IoService', () => {
  it('exports and imports database snapshot', async () => {
    const storage = new MemoryStorage()
    const uow = new LocalUnitOfWork(storage)
    const bootstrap = new BootstrapService(uow)
    const io = new IoService(uow)
    await bootstrap.ensureReady({ forceSeed: true })

    const envelope = await io.exportJson()
    expect(envelope.format).toBe('cki-flow-db')
    expect(envelope.database.products[0]?.key).toBe('CKI')

    await uow.reset()
    await io.importJson(JSON.stringify(envelope))
    const restored = await uow.read()
    expect(restored.products[0]?.key).toBe('CKI')
    expect(restored.workflowTemplates.length).toBeGreaterThan(0)
  })
})
