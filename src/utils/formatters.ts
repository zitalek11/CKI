export const formatMoney = (value?: number) =>
  typeof value === 'number' ? new Intl.NumberFormat('ru-RU').format(value) : '—'

export const formatPercent = (value?: number) =>
  typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : '—'
