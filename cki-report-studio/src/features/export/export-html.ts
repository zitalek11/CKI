import templateSource from '../../../resources/templates/template.html?raw'
import { renderHtml } from '@/core/render/render-html'
import { canExport, validateReport } from '@/core/validate/validate-report'
import type { WeeklyReport } from '@/core/model/types'
import { deriveReport } from '@/core/derive/derive-report'
import { exportHtmlToDisk, exportJsonToDisk } from '@/shared/lib/storage'

export async function exportHtmlFile(
  report: WeeklyReport,
  previous: WeeklyReport | null,
): Promise<{ ok: true; path: string | null } | { ok: false; message: string }> {
  const issues = validateReport(report).filter((i) => i.level === 'error')
  if (!canExport(report)) {
    return {
      ok: false,
      message: issues.map((i) => i.message).join('; ') || 'Отчёт не прошёл валидацию',
    }
  }

  const html = renderHtml(templateSource, deriveReport(report, previous))
  const path = await exportHtmlToDisk(`CKI-report-${report.meta.reportDate}.html`, html)
  if (path === null) {
    return { ok: false, message: 'Экспорт отменён' }
  }
  return { ok: true, path }
}

export async function exportJsonFile(report: WeeklyReport): Promise<string | null> {
  return exportJsonToDisk(`${report.meta.id}.json`, report)
}
