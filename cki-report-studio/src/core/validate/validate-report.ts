import { weeklyReportSchema } from '@/core/schema/weekly-report'
import type { WeeklyReport } from '@/core/model/types'

export interface ValidationIssue {
  path: string
  message: string
  level: 'error' | 'warning'
}

export function validateReport(report: WeeklyReport): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const parsed = weeklyReportSchema.safeParse(report)

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      issues.push({
        path: issue.path.join('.') || 'root',
        message: issue.message,
        level: 'error',
      })
    }
    return issues
  }

  for (const metric of report.metrics) {
    if (metric.format === 'percent' && (metric.value < 0 || metric.value > 100)) {
      issues.push({
        path: `metrics.${metric.id}`,
        message: `${metric.label}: процент должен быть от 0 до 100`,
        level: 'error',
      })
    }
    if (metric.id === 'revenueAccumulated' && metric.value < 0) {
      issues.push({
        path: `metrics.${metric.id}`,
        message: 'Выручка не может быть отрицательной',
        level: 'error',
      })
    }
    if (metric.goalKey) {
      const goal = report.goals[metric.goalKey]
      if (goal > 0 && metric.value > goal * 1.5) {
        issues.push({
          path: `metrics.${metric.id}`,
          message: `${metric.label}: значение сильно выше цели (${goal}) — проверьте`,
          level: 'warning',
        })
      }
    }
  }

  for (const stage of report.funnel.stages) {
    if (stage.count < 0 || stage.amountThousands < 0) {
      issues.push({
        path: `funnel.${stage.id}`,
        message: `${stage.label}: недопустимы отрицательные значения`,
        level: 'error',
      })
    }
  }

  if (report.funnel.comments.some((c) => !c.text.trim())) {
    issues.push({
      path: 'funnel.comments',
      message: 'Есть пустые комментарии воронки',
      level: 'error',
    })
  }

  for (const chart of report.charts) {
    if (chart.fact.some((v) => v < 0)) {
      issues.push({
        path: `charts.${chart.id}`,
        message: `${chart.title}: факт не может быть отрицательным`,
        level: 'error',
      })
    }
    if (chart.fact.some((v) => v > chart.yMax)) {
      issues.push({
        path: `charts.${chart.id}`,
        message: `${chart.title}: факт превышает шкалу Y (${chart.yMax})`,
        level: 'warning',
      })
    }
  }

  return issues
}

export function canExport(report: WeeklyReport): boolean {
  return validateReport(report).every((i) => i.level !== 'error')
}
