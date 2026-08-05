import { addWorkingHours, maxDate, nextWorkingDay, parseIsoDate, toIsoDate } from '@/domain/engines/planning/calendar'
import type { Dependency, WorkItem } from '@/domain/model/entities'
import { DependencyKind, DependencyStrength } from '@/domain/model/enums'
import type { IsoDate } from '@/domain/model/system'

export type ScheduledWorkItem = WorkItem & {
  forecastStart: IsoDate
  forecastEnd: IsoDate
}

/**
 * ASAP schedule for work items using hard FS dependencies and working calendar.
 * Pure Planning Engine core.
 */
export function scheduleWorkItems(params: {
  workItems: WorkItem[]
  dependencies: Dependency[]
  projectStart: IsoDate
  hoursPerDay?: number
  holidays?: Set<string>
}): ScheduledWorkItem[] {
  const hoursPerDay = params.hoursPerDay ?? 8
  const holidays = params.holidays ?? new Set<string>()
  const items = params.workItems.map((item) => ({ ...item }))
  const byId = new Map<string, WorkItem>(items.map((item) => [item.id, item]))

  const hardFs = params.dependencies.filter(
    (dep) =>
      dep.strength === DependencyStrength.Hard &&
      dep.kind === DependencyKind.FS &&
      dep.fromType === 'work_item' &&
      dep.toType === 'work_item',
  )

  const inbound = new Map<string, Dependency[]>()
  for (const dep of hardFs) {
    const list = inbound.get(dep.toId) ?? []
    list.push(dep)
    inbound.set(dep.toId, list)
  }

  const scheduled = new Map<string, { start: Date; end: Date }>()
  const visiting = new Set<string>()

  const scheduleOne = (id: string): { start: Date; end: Date } => {
    const existing = scheduled.get(id)
    if (existing) return existing
    if (visiting.has(id)) {
      // Cycle guard — schedule at project start.
      const fallback = nextWorkingDay(parseIsoDate(params.projectStart), holidays)
      const item = byId.get(id)!
      const range = addWorkingHours(fallback, item.estimateHours, hoursPerDay, holidays)
      scheduled.set(id, range)
      return range
    }

    visiting.add(id)
    const item = byId.get(id)
    if (!item) {
      const fallback = nextWorkingDay(parseIsoDate(params.projectStart), holidays)
      return { start: fallback, end: fallback }
    }

    const preds = inbound.get(id) ?? []
    const lowerBounds = [nextWorkingDay(parseIsoDate(params.projectStart), holidays)]
    for (const dep of preds) {
      const predRange = scheduleOne(dep.fromId)
      const afterPred = new Date(predRange.end.getTime())
      afterPred.setUTCDate(afterPred.getUTCDate() + 1 + (dep.lagDays || 0))
      lowerBounds.push(nextWorkingDay(afterPred, holidays))
    }

    const start = maxDate(lowerBounds)
    const range = addWorkingHours(start, item.estimateHours, hoursPerDay, holidays)
    scheduled.set(id, range)
    visiting.delete(id)
    return range
  }

  for (const item of items) {
    scheduleOne(item.id)
  }

  return items.map((item) => {
    const range = scheduled.get(item.id)!
    return {
      ...item,
      forecastStart: toIsoDate(range.start),
      forecastEnd: toIsoDate(range.end),
    }
  })
}

export function rollupStoryForecast(workItems: ScheduledWorkItem[]): {
  forecastStart?: IsoDate
  forecastEnd?: IsoDate
} {
  if (workItems.length === 0) return {}
  const starts = workItems.map((item) => item.forecastStart).sort()
  const ends = workItems.map((item) => item.forecastEnd).sort()
  return {
    forecastStart: starts[0],
    forecastEnd: ends[ends.length - 1],
  }
}
