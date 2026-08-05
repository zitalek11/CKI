import type {
  DerivedFunnelStage,
  DerivedMetric,
  DerivedTeam,
  ReportViewModel,
  WeeklyReport,
} from '@/core/model/types'
import {
  deltaTone,
  formatDeltaLabel,
  formatMetricValue,
  formatNumber,
  formatReportDate,
  formatSignedNumber,
} from '@/core/format/format'
import { resolveTickerItems } from '@/core/derive/resolve-ticker'

function findPreviousMetric(previous: WeeklyReport | null, id: string): number | null {
  if (!previous) return null
  const metric = previous.metrics.find((m) => m.id === id)
  return metric ? metric.value : null
}

function deriveMetrics(report: WeeklyReport, previous: WeeklyReport | null): DerivedMetric[] {
  return report.metrics.map((metric) => {
    const prev = metric.compareWithPrevious ? findPreviousMetric(previous, metric.id) : null
    const delta = prev === null ? null : metric.value - prev
    const goalValue = metric.goalKey ? report.goals[metric.goalKey] : null
    const progressPercent =
      goalValue && goalValue > 0 ? Math.round((metric.value / goalValue) * 100) : null

    return {
      ...metric,
      delta,
      deltaLabel:
        delta === null
          ? '—'
          : delta === 0
            ? 'без изм.'
            : formatDeltaLabel(delta),
      tone: delta === null ? 'flat' : deltaTone(delta),
      progressPercent,
      progressWidth: progressPercent === null ? null : Math.min(100, Math.max(0, progressPercent)),
      displayValue: formatMetricValue(metric.value, metric.format),
      goalValue,
    }
  })
}

function deriveFunnel(report: WeeklyReport, previous: WeeklyReport | null) {
  const maxCount = Math.max(...report.funnel.stages.map((s) => s.count), 1)
  const stages: DerivedFunnelStage[] = report.funnel.stages.map((stage) => {
    const prev = previous?.funnel.stages.find((s) => s.id === stage.id)?.count ?? null
    const weeklyDelta = prev === null ? null : stage.count - prev
    return {
      ...stage,
      weeklyDelta,
      weeklyDeltaLabel:
        weeklyDelta === null
          ? '—'
          : weeklyDelta === 0
            ? '0'
            : formatSignedNumber(weeklyDelta, 0),
      barWidth: Math.max(8, Math.round((stage.count / maxCount) * 100)),
      tone: weeklyDelta === null ? 'flat' : deltaTone(weeklyDelta),
    }
  })

  const totalCount = stages.reduce((sum, s) => sum + s.count, 0)
  const totalAmount = stages.reduce((sum, s) => sum + s.amountThousands, 0)
  const totalDelta = stages.reduce((sum, s) => sum + (s.weeklyDelta ?? 0), 0)

  return {
    stages,
    totalCount,
    totalAmount,
    totalDelta,
    totalDeltaLabel: formatSignedNumber(totalDelta, 0),
    comments: report.funnel.comments,
  }
}

function deriveTeam(report: WeeklyReport): DerivedTeam {
  const { before, after } = report.team.dynamics
  const deltaFte = after.fte - before.fte
  const deltaCost = after.costThousands - before.costThousands
  const deltaFtePercent = before.fte === 0 ? 0 : (deltaFte / before.fte) * 100
  const deltaCostPercent =
    before.costThousands === 0 ? 0 : (deltaCost / before.costThousands) * 100

  return {
    staffPercent: report.team.fteTotal
      ? Math.round((report.team.fteStaff / report.team.fteTotal) * 100)
      : 0,
    contractPercent: report.team.fteTotal
      ? Math.round((report.team.fteContract / report.team.fteTotal) * 100)
      : 0,
    monthlyCostMillions: formatNumber(after.costThousands / 1000, 2),
    deltaFte,
    deltaCost,
    deltaFtePercent,
    deltaCostPercent,
    deltaFteLabel: formatSignedNumber(deltaFte, 1),
    deltaCostLabel: formatSignedNumber(deltaCost, 1),
    deltaFteTone: deltaTone(deltaFte),
    deltaCostTone: deltaTone(deltaCost),
  }
}

export function deriveReport(
  report: WeeklyReport,
  previous: WeeklyReport | null = null,
): ReportViewModel {
  const metrics = deriveMetrics(report, previous)
  const funnel = deriveFunnel(report, previous)
  const team = deriveTeam(report)

  const chartsPayload = report.charts.map((chart) => ({
    id: chart.id,
    title: chart.title,
    unit: chart.unit,
    yMax: chart.yMax,
    color: chart.color,
    labels: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
    plan: chart.plan,
    fact: chart.fact,
  }))

  return {
    report,
    formattedDate: formatReportDate(report.meta.reportDate),
    slideCount: 7,
    metrics,
    funnel,
    team,
    chartsJson: JSON.stringify(chartsPayload),
    titleTicker: resolveTickerItems(report.ticker.slides.title, report, metrics, team),
    closingTicker: resolveTickerItems(report.ticker.slides.closing, report, metrics, team),
  }
}
