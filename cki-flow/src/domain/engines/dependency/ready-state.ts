import type { Dependency, WorkItem } from '@/domain/model/entities'
import { DependencyStrength, WorkItemStatus } from '@/domain/model/enums'
import { isDependencySatisfied } from '@/domain/engines/dependency/cycle'

/** Pure Dependency Engine: compute which work items are ready / blocked. */
export function computeWorkItemRuntimeState(
  workItems: WorkItem[],
  dependencies: Dependency[],
): Map<string, { ready: boolean; blocked: boolean }> {
  const byId = new Map(workItems.map((item) => [item.id, item]))
  const result = new Map<string, { ready: boolean; blocked: boolean }>()

  for (const item of workItems) {
    const inbound = dependencies.filter(
      (dep) =>
        dep.toId === item.id &&
        dep.toType === 'work_item' &&
        dep.strength === DependencyStrength.Hard,
    )

    const unsatisfied = inbound.filter((dep) => {
      const predecessor = byId.get(dep.fromId)
      if (!predecessor) return true
      return !isDependencySatisfied({
        kind: dep.kind,
        predecessorStatus: predecessor.status,
      })
    })

    const blocked = unsatisfied.length > 0
    const ready =
      !blocked &&
      (item.status === WorkItemStatus.Planned ||
        item.status === WorkItemStatus.Ready ||
        item.status === WorkItemStatus.Blocked)

    result.set(item.id, { ready: ready && !blocked, blocked })
  }

  return result
}

export function suggestStatusAfterDependencyChange(
  item: WorkItem,
  blocked: boolean,
): WorkItemStatus | null {
  if (blocked && (item.status === WorkItemStatus.Ready || item.status === WorkItemStatus.InProgress)) {
    return WorkItemStatus.Blocked
  }
  if (!blocked && item.status === WorkItemStatus.Planned) {
    return WorkItemStatus.Ready
  }
  if (!blocked && item.status === WorkItemStatus.Blocked) {
    return WorkItemStatus.Ready
  }
  return null
}
