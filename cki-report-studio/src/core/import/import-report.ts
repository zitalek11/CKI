import type { WeeklyReport } from '@/core/model/types'
import { weeklyReportSchema } from '@/core/schema/weekly-report'

export function parseReportJson(raw: string): WeeklyReport {
  const data = JSON.parse(raw) as unknown
  return weeklyReportSchema.parse(data) as WeeklyReport
}

export function parseReportCsvMetrics(csv: string): Record<string, number> {
  const lines = csv
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
  const result: Record<string, number> = {}
  for (const line of lines.slice(1)) {
    const [id, value] = line.split(',').map((s) => s.trim())
    if (id && value !== undefined && value !== '') {
      result[id] = Number(value.replace(/\s/g, '').replace(',', '.'))
    }
  }
  return result
}

export function applyMetricCsv(report: WeeklyReport, csv: string): WeeklyReport {
  const map = parseReportCsvMetrics(csv)
  return {
    ...report,
    metrics: report.metrics.map((m) =>
      map[m.id] !== undefined && !Number.isNaN(map[m.id]) ? { ...m, value: map[m.id] } : m,
    ),
  }
}
