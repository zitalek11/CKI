import type { DeltaTone, MetricFormat } from '@/core/model/types'

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

export function formatReportDate(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`)
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function formatShortDate(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`)
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
