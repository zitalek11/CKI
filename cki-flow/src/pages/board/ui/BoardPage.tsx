import { useCallback, useEffect, useState } from 'react'
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { appServices } from '@/application/composition'
import type { BoardCard } from '@/application/services/board-service'
import type { StoryStatus } from '@/domain/model/enums'
import { BOARD_COLUMNS, canTransitionStory } from '@/domain/rules/story-status'
import { useStoryPeekStore } from '@/features/story-peek/model/peek-store'
import { useWorkspaceStore } from '@/features/workspace/model/workspace-store'
import { cn } from '@/shared/lib/cn'
import { labelStoryStatus } from '@/shared/lib/labels'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'

export function BoardPage() {
  const summary = useWorkspaceStore((s) => s.summary)
  const refresh = useWorkspaceStore((s) => s.refresh)
  const openPeek = useStoryPeekStore((s) => s.open)
  const [columns, setColumns] = useState<Record<string, BoardCard[]> | null>(null)
  const [error, setError] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

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
      setError(err instanceof Error ? err.message : 'Не удалось переместить')
    }
  }

  const onDragEnd = (event: DragEndEvent) => {
    const storyId = event.active.id as string
    const fromStatus = event.active.data.current?.status as StoryStatus | undefined
    const toStatus = event.over?.id as StoryStatus | undefined
    if (!toStatus || !fromStatus || toStatus === fromStatus) return
    if (!canTransitionStory(fromStatus, toStatus)) {
      setError(`Нельзя перевести User Story из статуса «${labelStoryStatus(fromStatus)}» в «${labelStoryStatus(toStatus)}»`)
      return
    }
    void move(storyId, toStatus)
  }

  if (!columns) {
    return <div className="p-6 text-[var(--color-text-tertiary)]">Загрузка доски…</div>
  }

  return (
    <section className="flex h-full flex-col gap-3 p-4">
      <header className="flex items-center justify-between px-2">
        <div>
          <h1 className="text-lg font-semibold">Доска</h1>
          <p className="text-[12px] text-[var(--color-text-secondary)]">
            Проекция статусов User Story. Перетащите карточку между колонками или используйте кнопки.
          </p>
        </div>
      </header>
      {error && <div className="px-2 text-[12px] text-[var(--color-danger)]">{error}</div>}
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto pb-2">
          {BOARD_COLUMNS.map((status) => (
            <BoardColumn
              key={status}
              status={status}
              cards={columns[status] ?? []}
              onMove={move}
              onOpen={openPeek}
            />
          ))}
        </div>
      </DndContext>
    </section>
  )
}

function BoardColumn({
  status,
  cards,
  onMove,
  onOpen,
}: {
  status: StoryStatus
  cards: BoardCard[]
  onMove: (storyId: string, toStatus: StoryStatus) => void
  onOpen: (storyId: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex w-[240px] shrink-0 flex-col rounded-[var(--radius-md)] border bg-[var(--color-bg-subtle)] transition-colors',
        isOver ? 'border-[var(--color-accent)]' : 'border-[var(--color-border-subtle)]',
      )}
    >
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-[12px] font-semibold">{labelStoryStatus(status)}</span>
        <Badge>{cards.length}</Badge>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto px-2 pb-2">
        {cards.map((card) => (
          <BoardStoryCard key={card.story.id} card={card} status={status} onMove={onMove} onOpen={onOpen} />
        ))}
      </div>
    </div>
  )
}

function BoardStoryCard({
  card,
  status,
  onMove,
  onOpen,
}: {
  card: BoardCard
  status: StoryStatus
  onMove: (storyId: string, toStatus: StoryStatus) => void
  onOpen: (storyId: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.story.id,
    data: { status },
  })

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onDoubleClick={() => onOpen(card.story.id)}
      className={cn(
        'touch-none rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-2.5 select-none',
        isDragging && 'z-10 opacity-70 shadow-lg',
      )}
    >
      <div className="font-mono text-[10px] text-[var(--color-text-tertiary)]">{card.story.key}</div>
      <div className="text-[13px] font-medium">{card.story.title}</div>
      <div className="mt-1 text-[11px] text-[var(--color-text-secondary)]">
        {card.workItemCount} задач · {card.remainingHours} ч · {card.progress}%
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {BOARD_COLUMNS.filter((target) => target !== status && canTransitionStory(status, target))
          .slice(0, 3)
          .map((target) => (
            <Button
              key={target}
              size="sm"
              variant="ghost"
              className="h-6 px-1.5 text-[10px]"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation()
                onMove(card.story.id, target)
              }}
            >
              → {labelStoryStatus(target)}
            </Button>
          ))}
      </div>
    </article>
  )
}
