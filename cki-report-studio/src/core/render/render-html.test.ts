import { describe, expect, it } from 'vitest'
import templateSource from '../../../resources/templates/template.html?raw'
import seed from '../../../resources/reports/2026-07-23.json'
import { deriveReport } from '@/core/derive/derive-report'
import { renderHtml } from '@/core/render/render-html'
import type { WeeklyReport } from '@/core/model/types'

describe('renderHtml', () => {
  it('renders seed report with editable fields and charts payload', () => {
    const html = renderHtml(templateSource, deriveReport(seed as WeeklyReport, null))
    expect(html.length).toBeGreaterThan(10000)
    expect(html).toContain('data-field')
    expect(html).toContain('CHARTS')
    expect(html).toContain('Chart')
    expect(html).toContain('23')
  })
})
