import { describe, expect, it } from 'vitest'
import { wouldCreateCycle, assertAcyclicHardDependencies } from '@/domain/engines/dependency/cycle'
import { DependencyKind, DependencySource, DependencyStrength, PlanningObjectType } from '@/domain/model/enums'
import type { Dependency } from '@/domain/model/entities'
import { createId } from '@/domain/model/ids'
import { DomainError } from '@/domain/model/errors'

function dep(fromId: string, toId: string): Dependency {
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
    source: DependencySource.Manual,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'test',
    updatedBy: 'test',
  }
}

describe('dependency cycle detection', () => {
  it('detects trivial self-cycle', () => {
    expect(wouldCreateCycle([], 'a', 'a')).toBe(true)
  })

  it('detects indirect cycle', () => {
    const edges = [
      { fromId: 'a', toId: 'b' },
      { fromId: 'b', toId: 'c' },
    ]
    expect(wouldCreateCycle(edges, 'c', 'a')).toBe(true)
    expect(wouldCreateCycle(edges, 'a', 'c')).toBe(false)
  })

  it('rejects hard dependency that closes a cycle', () => {
    const existing = [dep('a', 'b'), dep('b', 'c')]
    expect(() =>
      assertAcyclicHardDependencies(existing, {
        fromId: 'c' as Dependency['fromId'],
        toId: 'a' as Dependency['toId'],
        strength: DependencyStrength.Hard,
      }),
    ).toThrow(DomainError)
  })
})
