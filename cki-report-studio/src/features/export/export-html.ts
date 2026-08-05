import templateSource from '../../../resources/templates/template.html?raw'
import { renderHtml } from '@/core/render/render-html'
import { canExport, validateReport } from '@/core/validate/validate-report'
import type { WeeklyReport } from '@/core/model/types'
import { deriveReport } from '@/core/derive/derive-report'

export function exportHtmlFile(
  report: WeeklyReport,
  previous: WeeklyReport | null,
): { ok: true } | { ok: false; message: string } {
  const issues = validateReport(report).filter((i) => i.level === 'error')
  if (!canExport(report)) {
    return {
      ok: false,
      message: issues.map((i) => i.message).join('; ') || 'Отчёт не прошёл валидацию',
    }
  }

  const html = renderHtml(templateSource, deriveReport(report, previous))
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `CKI-report-${report.meta.reportDate}.html`
  a.click()
  URL.revokeObjectURL(url)
  return { ok: true }
}

export function exportJsonFile(report: WeeklyReport) {
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${report.meta.id}.json`
  a.click()
  URL.revokeObjectURL(url)
}
