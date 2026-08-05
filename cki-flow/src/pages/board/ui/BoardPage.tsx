import { useCallback, useEffect, useState } from 'react'
import { appServices } from '@/application/composition'
import type { BoardCard } from '@/application/services/board-service'
import type { StoryStatus } from '@/domain/model/enums'
import { BOARD_COLUMNS, canTransitionStory } from '@/domain/rules/story-status'
import { useWorkspaceStore } from '@/features/workspace/model/workspace-store'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'

export function BoardPage() {
  const summary = useWorkspaceStore((s) => s.summary)
  const refresh = useWorkspaceStore((s) => s.refresh)
  const [columns, setColumns] = useState<Record<string, BoardCard[]> | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!summary) return
    setColumns(await appServices.board.getBoard(summary.product.id))
  }, [summary])

  useEffect(() => {
    void reload()
  }, [reload, summary?.counts.stories])

  const move = async (storyId: string, toStatus: StoryStatus) => {
    if (!summary) return
    setError(null)
    try {
      await appServices.board.moveStory({
        productId: summary.product.id,
        storyId,
        toStatus,
      })
      await refresh()
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Move failed')
    }
  }

  if (!columns) {
    return <div className="p-6 text-[var(--color-text-tertiary)]">Loading board…</div>
  }

  return (
    <section className="flex h-full flex-col gap-3 p-4">
      <header className="flex items-center justify-between px-2">
        <div>
          <h1 className="text-lg font-semibold">Board</h1>
          <p className="text-[12px] text-[var(--color-text-secondary)]">
            Проекция статусов Story. Переход — кнопки (DnD добавим на polish).
          </p>
        </div>
      </header>
      {error && <div className="px-2 text-[12px] text-[var(--color-danger)]">{error}</div>}
      <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto pb-2">
        {BOARD_COLUMNS.map((status) => (
          <div
            key={status}
            className="flex w-[240px] shrink-0 flex-col rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)]"
          >
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-[12px] font-semibold capitalize">{status.replace('_', ' ')}</span>
              <Badge>{columns[status]?.length ?? 0}</Badge>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto px-2 pb-2">
              {(columns[status] ?? []).map((card) => (
                <article
                  key={card.story.id}
                  className="rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-2.5"
                >
                  <div className="font-mono text-[10px] text-[var(--color-text-tertiary)]">
                    {card.story.key}
                  </div>
                  <div className="text-[13px] font-medium">{card.story.title}</div>
                  <div className="mt-1 text-[11px] text-[var(--color-text-secondary)]">
                    {card.workItemCount} works · {card.remainingHours}h · {card.progress}%
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {BOARD_COLUMNS.filter(
                      (target) => target !== status && canTransitionStory(status, target),
                    )
                      .slice(0, 3)
                      .map((target) => (
                        <Button
                          key={target}
                          size="sm"
                          variant="ghost"
                          className="h-6 px-1.5 text-[10px]"
                          onClick={() => void move(card.story.id, target)}
                        >
                          → {target.replace('_', ' ')}
                        </Button>
                      ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
