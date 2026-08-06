import type { IsoDate } from '@/domain/model/system'

const DAY_MS = 24 * 60 * 60 * 1000

export function parseIsoDate(value: IsoDate): Date {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1))
}

export function toIsoDate(date: Date): IsoDate {
  return date.toISOString().slice(0, 10)
}

export function isWeekend(date: Date): boolean {
  const day = date.getUTCDay()
  return day === 0 || day === 6
}

export function nextWorkingDay(date: Date, holidays: Set<string> = new Set()): Date {
  const cursor = new Date(date.getTime())
  while (isWeekend(cursor) || holidays.has(toIsoDate(cursor))) {
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return cursor
}

/** Add working hours assuming 8h / working day. */
export function addWorkingHours(
  start: Date,
  hours: number,
  hoursPerDay = 8,
  holidays: Set<string> = new Set(),
): { start: Date; end: Date } {
  let cursor = nextWorkingDay(start, holidays)
  const startWork = new Date(cursor.getTime())
  let remaining = Math.max(hours, 0)

  if (remaining === 0) {
    return { start: startWork, end: startWork }
  }

  while (remaining > 0) {
    cursor = nextWorkingDay(cursor, holidays)
    const consume = Math.min(hoursPerDay, remaining)
    remaining -= consume
    if (remaining > 0) {
      cursor = new Date(cursor.getTime() + DAY_MS)
    }
  }

  return { start: startWork, end: cursor }
}

export function maxDate(dates: Date[]): Date {
  return dates.reduce((max, date) => (date > max ? date : max))
}
