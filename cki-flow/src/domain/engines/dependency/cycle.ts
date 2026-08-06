import { DomainError } from '@/domain/model/errors'
import type { Dependency } from '@/domain/model/entities'
import { DependencyStrength } from '@/domain/model/enums'

export type GraphEdge = {
  fromId: string
  toId: string
}

/** Returns true if adding edge from→to would create a cycle in directed graph. */
export function wouldCreateCycle(edges: GraphEdge[], fromId: string, toId: string): boolean {
  if (fromId === toId) return true

  const adjacency = new Map<string, string[]>()
  for (const edge of edges) {
    const list = adjacency.get(edge.fromId) ?? []
    list.push(edge.toId)
    adjacency.set(edge.fromId, list)
  }

  const stack = [toId]
  const visited = new Set<string>()

  while (stack.length > 0) {
    const current = stack.pop()
    if (!current) break
    if (current === fromId) return true
    if (visited.has(current)) continue
    visited.add(current)
    for (const next of adjacency.get(current) ?? []) {
      stack.push(next)
    }
  }

  return false
}

export function assertAcyclicHardDependencies(
  dependencies: Dependency[],
  candidate?: Pick<Dependency, 'fromId' | 'toId' | 'strength'>,
): void {
  const hardEdges = dependencies
    .filter((dep) => dep.strength === DependencyStrength.Hard)
    .map((dep) => ({ fromId: dep.fromId, toId: dep.toId }))

  if (candidate && candidate.strength === DependencyStrength.Hard) {
    if (wouldCreateCycle(hardEdges, candidate.fromId, candidate.toId)) {
      throw new DomainError(
        'INVARIANT',
        'Hard dependency would create a cycle',
        { fromId: candidate.fromId, toId: candidate.toId },
      )
    }
  }

  // Validate existing graph has no cycle.
  const nodes = new Set<string>()
  for (const edge of hardEdges) {
    nodes.add(edge.fromId)
    nodes.add(edge.toId)
  }

  const adjacency = new Map<string, string[]>()
  for (const edge of hardEdges) {
    const list = adjacency.get(edge.fromId) ?? []
    list.push(edge.toId)
    adjacency.set(edge.fromId, list)
  }

  const visiting = new Set<string>()
  const visited = new Set<string>()

  const dfs = (node: string): boolean => {
    if (visiting.has(node)) return true
    if (visited.has(node)) return false
    visiting.add(node)
    for (const next of adjacency.get(node) ?? []) {
      if (dfs(next)) return true
    }
    visiting.delete(node)
    visited.add(node)
    return false
  }

  for (const node of nodes) {
    if (dfs(node)) {
      throw new DomainError('INVARIANT', 'В графе жёстких зависимостей есть цикл')
    }
  }
}

export function isDependencySatisfied(params: {
  kind: Dependency['kind']
  predecessorStatus: string
}): boolean {
  const doneLike = new Set(['done', 'released', 'completed', 'achieved'])
  const startedLike = new Set(['in_progress', 'in_review', 'done', 'blocked'])

  switch (params.kind) {
    case 'FS':
      return doneLike.has(params.predecessorStatus)
    case 'SS':
      return startedLike.has(params.predecessorStatus) || doneLike.has(params.predecessorStatus)
    case 'FF':
      return doneLike.has(params.predecessorStatus)
    case 'SF':
      return startedLike.has(params.predecessorStatus) || doneLike.has(params.predecessorStatus)
    default:
      return false
  }
}
