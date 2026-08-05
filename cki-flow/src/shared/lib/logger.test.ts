import { describe, expect, it, vi } from 'vitest'
import { logger } from '@/shared/lib/logger'

describe('logger', () => {
  it('notifies subscribers on info events', () => {
    const spy = vi.fn()
    const unsubscribe = logger.subscribe(spy)

    logger.info('User Story created', { key: 'CKI-1' }, 'story')

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0]?.[0]).toMatchObject({
      level: 'info',
      message: 'User Story created',
      scope: 'story',
    })

    unsubscribe()
  })
})
