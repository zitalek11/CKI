import type { WeeklyReport } from '@/core/model/types'

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export interface CreateNextWeekOptions {
  reportDate?: string
  weekNumber?: number
}

/** Copy previous week, bump date/week, shift activities columns. */
export function createNextWeek(
  previous: WeeklyReport,
  options: CreateNextWeekOptions = {},
): WeeklyReport {
  const reportDate = options.reportDate ?? addDays(previous.meta.reportDate, 7)
  const weekNumber = options.weekNumber ?? previous.meta.weekNumber + 1
  const nextActivityDate = addDays(previous.activities.weekDates[2], 7)

  const now = new Date().toISOString()

  return {
    ...structuredClone(previous),
    meta: {
      ...previous.meta,
      id: reportDate,
      weekNumber,
      reportDate,
      previousReportId: previous.meta.id,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      notes: `Создано из недели ${previous.meta.weekNumber}`,
    },
    activities: {
      weekDates: [
        previous.activities.weekDates[1],
        previous.activities.weekDates[2],
        nextActivityDate,
      ],
      rows: previous.activities.rows.map((row) => ({
        role: row.role,
        cells: [row.cells[1], row.cells[2], ''],
      })),
    },
  }
}
