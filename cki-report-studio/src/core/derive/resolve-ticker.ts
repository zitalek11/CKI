import type { TickerItem, WeeklyReport, DerivedMetric, DerivedTeam } from '@/core/model/types'
import { formatMetricValue, formatNumber } from '@/core/format/format'

function resolvePathValue(
  path: string,
  report: WeeklyReport,
  metrics: DerivedMetric[],
  team: DerivedTeam,
): number | string | undefined {
  if (path.startsWith('metrics.')) {
    const id = path.slice('metrics.'.length)
    return metrics.find((m) => m.id === id)?.value
  }
  if (path.startsWith('goals.')) {
    const key = path.slice('goals.'.length) as keyof typeof report.goals
    return report.goals[key]
  }
  if (path === 'team.fteTotal') return report.team.fteTotal
  if (path === 'team.dynamics.after.costThousands') return report.team.dynamics.after.costThousands
  if (path === 'team.monthlyCostMillions') return team.monthlyCostMillions
  return undefined
}

export function resolveTickerItems(
  items: TickerItem[],
  report: WeeklyReport,
  metrics: DerivedMetric[],
  team: DerivedTeam,
): string[] {
  return items.map((item) => {
    if (item.type === 'static') return item.text
    return item.template.replace(/\{\{([^}]+)\}\}/g, (_, raw: string) => {
      const [path, filter] = raw.split('|').map((s: string) => s.trim())
      const value = resolvePathValue(path, report, metrics, team)
      if (value === undefined) return ''
      if (filter === 'currency') return formatMetricValue(Number(value), 'currency')
      if (filter === 'millions') {
        if (path.includes('costThousands')) return formatNumber(Number(value) / 1000, 2)
        return formatNumber(Number(value) / 1_000_000, 0)
      }
      return String(value)
    })
  })
}
