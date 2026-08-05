import { describe, expect, it } from 'vitest'
import { deriveReport } from '@/core/derive/derive-report'
import { createNextWeek } from '@/core/week/create-next-week'
import { validateReport, canExport } from '@/core/validate/validate-report'
import { formatDeltaLabel, formatMetricValue } from '@/core/format/format'
import seed from '../../../resources/reports/2026-07-23.json'
import type { WeeklyReport } from '@/core/model/types'

const report = seed as WeeklyReport

describe('format', () => {
  it('formats currency and delta', () => {
    expect(formatMetricValue(1732000, 'currency')).toBe('1 732 000')
    expect(formatDeltaLabel(2)).toContain('▲')
    expect(formatDeltaLabel(-3)).toContain('▼')
    expect(formatDeltaLabel(0)).toBe('без изм.')
  })
})

describe('deriveReport', () => {
  it('computes progress and funnel totals', () => {
    const previous: WeeklyReport = {
      ...structuredClone(report),
      metrics: report.metrics.map((m) =>
        m.id === 'apiRequests' ? { ...m, value: 905 } : m.id === 'clientsExternal' ? { ...m, value: 17 } : m,
      ),
      funnel: {
        ...report.funnel,
        stages: report.funnel.stages.map((s) =>
          s.id === 'signed' ? { ...s, count: 8 } : s,
        ),
      },
    }

    const vm = deriveReport(report, previous)
    const clients = vm.metrics.find((m) => m.id === 'clientsExternal')!
    expect(clients.progressPercent).toBe(32)
    expect(clients.delta).toBe(0)
    expect(clients.deltaLabel).toBe('без изм.')

    const api = vm.metrics.find((m) => m.id === 'apiRequests')!
    expect(api.delta).toBe(1)
    expect(api.tone).toBe('up')

    // Source HTML said 109, but stage sum is 118 — auto-total fixes that class of bugs.
    expect(vm.funnel.totalCount).toBe(61 + 31 + 12 + 5 + 9)
    expect(vm.funnel.totalAmount).toBe(17940 + 8100 + 5395 + 1223 + 2847)

    const signed = vm.funnel.stages.find((s) => s.id === 'signed')!
    expect(signed.weeklyDelta).toBe(1)
  })

  it('derives team deltas', () => {
    const vm = deriveReport(report, null)
    expect(vm.team.staffPercent).toBe(78)
    expect(vm.team.deltaFte).toBeCloseTo(-4.3, 5)
  })
})

describe('createNextWeek', () => {
  it('shifts activities and bumps week', () => {
    const next = createNextWeek(report)
    expect(next.meta.weekNumber).toBe(31)
    expect(next.meta.reportDate).toBe('2026-07-30')
    expect(next.meta.previousReportId).toBe('2026-07-23')
    expect(next.activities.weekDates).toEqual(['2026-07-27', '2026-08-03', '2026-08-10'])
    expect(next.activities.rows[0].cells[2]).toBe('')
    expect(next.activities.rows[0].cells[0]).toBe(report.activities.rows[0].cells[1])
  })
})

describe('validateReport', () => {
  it('accepts seed report', () => {
    const issues = validateReport(report)
    expect(issues.filter((i) => i.level === 'error')).toHaveLength(0)
    expect(canExport(report)).toBe(true)
  })

  it('rejects negative revenue', () => {
    const bad = structuredClone(report)
    const m = bad.metrics.find((x) => x.id === 'revenueAccumulated')!
    m.value = -1
    expect(canExport(bad)).toBe(false)
  })
})
