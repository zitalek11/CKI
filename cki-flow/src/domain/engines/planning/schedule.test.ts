import { describe, expect, it } from 'vitest'
import { scheduleWorkItems } from '@/domain/engines/planning/schedule'
import type { Dependency, WorkItem } from '@/domain/model/entities'
import {
  DependencyKind,
  DependencySource,
  DependencyStrength,
  PlanningObjectType,
  WorkItemOrigin,
  WorkItemStatus,
} from '@/domain/model/enums'
import { createId } from '@/domain/model/ids'

function wi(id: string, hours: number): WorkItem {
  const now = new Date().toISOString()
  return {
    id: id as WorkItem['id'],
    productId: createId(),
    userStoryId: createId(),
    key: id,
    title: id,
    workTypeId: createId(),
    requiredRoleSkillId: createId(),
    status: WorkItemStatus.Planned,
    origin: WorkItemOrigin.Template,
    isMandatory: true,
    estimateHours: hours,
    createdAt: now,
    updatedAt: now,
    createdBy: 't',
    updatedBy: 't',
  }
}

function fs(fromId: string, toId: string): Dependency {
  const now = new Date().toISOString()
  return {
    id: createId(),
    productId: createId(),
    fromType: PlanningObjectType.WorkItem,
    fromId: fromId as Dependency['fromId'],
    toType: PlanningObjectType.WorkItem,
    toId: toId as Dependency['toId'],
    kind: DependencyKind.FS,
    strength: DependencyStrength.Hard,
    lagDays: 0,
    source: DependencySource.Template,
    createdAt: now,
    updatedAt: now,
    createdBy: 't',
    updatedBy: 't',
  }
}

describe('scheduleWorkItems', () => {
  it('schedules FS chain across working days', () => {
    // 2026-08-05 is Wednesday
    const items = scheduleWorkItems({
      workItems: [wi('a', 8), wi('b', 8)],
      dependencies: [fs('a', 'b')],
      projectStart: '2026-08-05',
    })

    const a = items.find((item) => item.id === 'a')!
    const b = items.find((item) => item.id === 'b')!
    expect(a.forecastStart).toBe('2026-08-05')
    expect(a.forecastEnd).toBe('2026-08-05')
    expect(b.forecastStart).toBe('2026-08-06')
  })

  it('skips weekends', () => {
    const items = scheduleWorkItems({
      workItems: [wi('a', 8)],
      dependencies: [],
      projectStart: '2026-08-08', // Saturday
    })
    expect(items[0]?.forecastStart).toBe('2026-08-10')
  })
})
