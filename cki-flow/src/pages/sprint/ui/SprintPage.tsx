import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { appServices } from '@/application/composition'
import type { SprintBoardItem } from '@/application/services/sprint-service'
import { calculateRoleDemand } from '@/domain/engines/capacity/demand'
import { useWorkspaceStore } from '@/features/workspace/model/workspace-store'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'

export function SprintPage() {
  const summary = useWorkspaceStore((s) => s.summary)
  const refreshWorkspace = useWorkspaceStore((s) => s.refresh)
  const [ready, setReady] = useState<SprintBoardItem[]>([])
  const [committed, setCommitted] = useState<SprintBoardItem[]>([])
  const [loadByRole, setLoadByRole] = useState<Array<{ code: string; hours: number }>>([])
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!summary) return
    const productId = summary.product.id
    const [readyItems, committedItems] = await Promise.all([
      appServices.sprints.listReadyBacklog(productId),
      appServices.sprints.listCommitted(productId),
    ])
    setReady(readyItems)
    setCommitted(committedItems)

    const db = await appServices.uow.read()
    const sprint = await appServices.sprints.getActiveSprint(productId)
    const work = db.workItems.filter((item) => item.sprintId === sprint?.id)
    const demand = calculateRoleDemand(work)
    setLoadByRole(
      demand.map((item) => ({
        code: db.roleSkills.find((role) => role.id === item.roleSkillId)?.code ?? '?',
        hours: item.hours,
      })),
    )
  }, [summary])

  useEffect(() => {
    void reload()
  }, [reload, summary?.counts.stories])

  const commit = async (storyId: string) => {
    if (!summary) return
    setBusyId(storyId)
    setError(null)
    try {
      await appServices.sprints.commitStory({ productId: summary.product.id, storyId })
      await refreshWorkspace()
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Commit failed')
    } finally {
      setBusyId(null)
    }
  }

  const uncommit = async (storyId: string) => {
    if (!summary) return
    setBusyId(storyId)
    setError(null)
    try {
      await appServices.sprints.uncommitStory({ productId: summary.product.id, storyId })
      await refreshWorkspace()
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Uncommit failed')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="flex h-full flex-col gap-4 p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight">Sprint</h1>
          <p className="text-[var(--color-text-secondary)]">
            {summary?.sprint?.name ?? 'No active sprint'} · {summary?.sprint?.startDate} →{' '}
            {summary?.sprint?.endDate}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {loadByRole.map((row) => (
            <Badge key={row.code} tone="accent">
              {row.code} {row.hours}h
            </Badge>
          ))}
        </div>
      </header>

      {error && (
        <div className="rounded-[var(--radius-sm)] border border-[var(--color-danger)]/30 bg-[color-mix(in_oklab,var(--color-danger)_10%,transparent)] px-3 py-2 text-[12px] text-[var(--color-danger)]">
          {error}
        </div>
      )}

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
        <Pane title="Ready backlog" count={ready.length}>
          {ready.map((item) => (
            <StoryRow
              key={item.story.id}
              item={item}
              actionLabel="Commit"
              busy={busyId === item.story.id}
              onAction={() => void commit(item.story.id)}
            />
          ))}
        </Pane>
        <Pane title="Sprint commitment" count={committed.length}>
          {committed.map((item) => (
            <StoryRow
              key={item.story.id}
              item={item}
              actionLabel="Remove"
              busy={busyId === item.story.id}
              onAction={() => void uncommit(item.story.id)}
              showForecast
            />
          ))}
        </Pane>
      </div>
    </section>
  )
}

function Pane({
  title,
  count,
  children,
}: {
  title: string
  count: number
  children: ReactNode
}) {
  return (
    <div className="flex min-h-[320px] flex-col rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]">
      <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] px-4 py-3">
        <h2 className="text-[13px] font-semibold">{title}</h2>
        <Badge>{count}</Badge>
      </div>
      <div className="flex-1 space-y-2 overflow-auto p-3">
        {count === 0 ? (
          <p className="px-1 py-6 text-center text-[12px] text-[var(--color-text-tertiary)]">Пусто</p>
        ) : (
          children
        )}
      </div>
    </div>
  )
}

function StoryRow({
  item,
  actionLabel,
  onAction,
  busy,
  showForecast,
}: {
  item: SprintBoardItem
  actionLabel: string
  onAction: () => void
  busy: boolean
  showForecast?: boolean
}) {
  return (
    <div className="rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-app)] px-3 py-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-mono text-[11px] text-[var(--color-text-tertiary)]">{item.story.key}</div>
          <div className="font-medium">{item.story.title}</div>
          <div className="mt-1 text-[12px] text-[var(--color-text-secondary)]">
            {item.workItemCount} works · {item.remainingHours}h
            {showForecast && item.forecastStart && item.forecastEnd
              ? ` · ${item.forecastStart} → ${item.forecastEnd}`
              : ''}
          </div>
        </div>
        <Button size="sm" variant={actionLabel === 'Commit' ? 'primary' : 'ghost'} disabled={busy} onClick={onAction}>
          {actionLabel}
        </Button>
      </div>
    </div>
  )
}
