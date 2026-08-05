import type { DeltaTone, MetricFormat } from '@/core/model/types'

const RU_MONTHS: Record<string, number> = {
  января: 1,
  февраля: 2,
  марта: 3,
  апреля: 4,
  мая: 5,
  июня: 6,
  июля: 7,
  августа: 8,
  сентября: 9,
  октября: 10,
  ноября: 11,
  декабря: 12,
  янв: 1,
  фев: 2,
  мар: 3,
  апр: 4,
  май: 5,
  июн: 6,
  июл: 7,
  авг: 8,
  сен: 9,
  окт: 10,
  ноя: 11,
  дек: 12,
}

export function formatNumber(value: number, fractionDigits = 0): string {
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(value)
}

export function formatCurrency(value: number): string {
  return formatNumber(Math.round(value))
}

export function formatMetricValue(value: number, format: MetricFormat): string {
  switch (format) {
    case 'currency':
      return formatCurrency(value)
    case 'percent':
      return `${formatNumber(value)}%`
    case 'thousands':
      return formatNumber(value)
    default:
      return formatNumber(value)
  }
}

function isValidDate(date: Date): boolean {
  return !Number.isNaN(date.getTime())
}

/** Accepts ISO YYYY-MM-DD, DD.MM.YYYY, DD/MM/YYYY, or Russian "6 августа 2026". */
export function parseFlexibleDate(input: string, fallbackYear?: number): string | null {
  const raw = input.trim().replace(/\u00a0/g, ' ')
  if (!raw) return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const d = new Date(`${raw}T12:00:00`)
    return isValidDate(d) ? raw : null
  }

  const dotted = raw.match(/^(\d{1,2})[./](\d{1,2})[./](\d{2,4})$/)
  if (dotted) {
    const day = Number(dotted[1])
    const month = Number(dotted[2])
    let year = Number(dotted[3])
    if (year < 100) year += 2000
    const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const d = new Date(`${iso}T12:00:00`)
    return isValidDate(d) ? iso : null
  }

  const normalized = raw
    .toLowerCase()
    .replace(/г\./g, '')
    .replace(/,/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const dayMatch = normalized.match(/^(\d{1,2})\s+(.+)$/)
  if (dayMatch) {
    const day = Number(dayMatch[1])
    const rest = dayMatch[2].trim()
    const yearMatch = rest.match(/(\d{4})\s*$/)
    const year = yearMatch ? Number(yearMatch[1]) : (fallbackYear ?? new Date().getFullYear())
    const monthPart = rest.replace(/\d{4}\s*$/, '').trim()
    const month = RU_MONTHS[monthPart]
    if (month) {
      const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const d = new Date(`${iso}T12:00:00`)
      return isValidDate(d) ? iso : null
    }
  }

  return null
}

export function formatReportDate(isoDate: string): string {
  const parsed = parseFlexibleDate(isoDate) ?? isoDate
  const date = new Date(`${parsed}T12:00:00`)
  if (!isValidDate(date)) return isoDate || '—'
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function formatShortDate(isoDate: string): string {
  const parsed = parseFlexibleDate(isoDate) ?? isoDate
  const date = new Date(`${parsed}T12:00:00`)
  if (!isValidDate(date)) return isoDate || '—'
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function deltaTone(delta: number): DeltaTone {
  if (delta > 0) return 'up'
  if (delta < 0) return 'down'
  return 'flat'
}

/** For cost/FTE reduction, down can be "good" — caller decides label color in template. */
export function formatDeltaLabel(delta: number, opts?: { invertArrow?: boolean }): string {
  if (delta === 0) return 'без изм.'
  const abs = Math.abs(delta)
  const formatted = Number.isInteger(abs) ? formatNumber(abs) : formatNumber(abs, 1)
  const up = opts?.invertArrow ? '▼' : '▲'
  const down = opts?.invertArrow ? '▲' : '▼'
  if (delta > 0) return `${up} +${formatted}`
  return `${down} −${formatted}`
}

export function formatSignedNumber(value: number, digits = 1): string {
  const formatted = formatNumber(Math.abs(value), digits)
  if (value > 0) return `+${formatted}`
  if (value < 0) return `−${formatted}`
  return formatted
}

export function formatMillions(value: number): string {
  return formatNumber(value / 1_000_000, value % 1_000_000 === 0 ? 0 : 2)
}
