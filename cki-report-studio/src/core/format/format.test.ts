import { describe, expect, it } from 'vitest'
import { formatReportDate, parseFlexibleDate } from '@/core/format/format'

describe('parseFlexibleDate', () => {
  it('parses ISO', () => {
    expect(parseFlexibleDate('2026-08-06')).toBe('2026-08-06')
  })

  it('parses dotted and russian dates', () => {
    expect(parseFlexibleDate('06.08.2026')).toBe('2026-08-06')
    expect(parseFlexibleDate('6 августа 2026')).toBe('2026-08-06')
    expect(parseFlexibleDate('06 августа', 2026)).toBe('2026-08-06')
    expect(parseFlexibleDate('23 июля 2026 г.')).toBe('2026-07-23')
  })

  it('rejects garbage', () => {
    expect(parseFlexibleDate('не дата')).toBeNull()
  })
})

describe('formatReportDate', () => {
  it('does not throw on invalid input', () => {
    expect(formatReportDate('06 августа')).not.toBe('')
    expect(formatReportDate('???')).toBe('???')
  })
})
