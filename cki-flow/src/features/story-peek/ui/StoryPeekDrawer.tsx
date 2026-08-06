import { useCallback, useEffect, useState } from 'react'
import { ChevronDown, ChevronRight, Plus, X } from 'lucide-react'
import { appServices } from '@/application/composition'
import { useStoryPeekStore } from '@/features/story-peek/model/peek-store'
import { useWorkspaceStore } from '@/features/workspace/model/workspace-store'
import { labelStoryPriority, labelStoryStatus, labelStoryType, labelWorkItemStatus } from '@/shared/lib/labels'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/cn'

type StoryDetail = Awaited<ReturnType<typeof appServices.stories.getById>>

export function StoryPeekDrawer() {
  const selectedStoryId = useStoryPeekStore((s) => s.selectedStoryId)
  const close = useStoryPeekStore((s) => s.close)
  const summary = useWorkspaceStore((s) => s.summary)
  const refreshWorkspace = useWorkspaceStore((s) => s.refresh)

  const [detail, setDetail] = useState<StoryDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [newAc, setNewAc] = useState('')
  const [newDod, setNewDod] = useState('')
  const [newComment, setNewComment] = useState('')
  const [expandedWorkItemId, setExpandedWorkItemId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const reload = useCallback(async () => {
    if (!selectedStoryId) return
    try {
      setDetail(await appServices.stories.getById(selectedStoryId))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить User Story')
    }
  }, [selectedStoryId])

  useEffect(() => {
    if (!selectedStoryId) {
      setDetail(null)
      return
    }
    void reload()
  }, [selectedStoryId, reload])

  useEffect(() => {
    if (!detail || !summary) return
    void appServices.navigation.touch({
      productId: summary.product.id,
      objectType: 'user_story',
      objectId: detail.story.id,
      label: `${detail.story.key} · ${detail.story.title}`,
      path: '/deliver/backlog',
    })
  }, [detail?.story.id, summary?.product.id])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [close])

  if (!selectedStoryId) return null

  const addAcceptanceCriterion = async () => {
    if (!newAc.trim()) return
    setBusy(true)
    try {
      await appServices.stories.addAcceptanceCriterion({ storyId: selectedStoryId, text: newAc })
      setNewAc('')
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось добавить критерий')
    } finally {
      setBusy(false)
    }
  }

  const toggleAcceptanceCriterion = async (criterionId: string) => {
    try {
      await appServices.stories.toggleAcceptanceCriterion({ criterionId })
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось обновить критерий')
    }
  }

  const addDodItem = async () => {
    if (!newDod.trim()) return
    setBusy(true)
    try {
      await appServices.stories.addDefinitionOfDoneItem({ storyId: selectedStoryId, text: newDod })
      setNewDod('')
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось добавить пункт DoD')
    } finally {
      setBusy(false)
    }
  }

  const toggleDodItem = async (itemId: string) => {
    try {
      await appServices.stories.toggleDefinitionOfDoneItem({ itemId })
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось обновить пункт DoD')
    }
  }

  const addComment = async () => {
    if (!newComment.trim() || !summary) return
    setBusy(true)
    try {
      await appServices.stories.addComment({
        productId: summary.product.id,
        storyId: selectedStoryId,
        body: newComment,
      })
      setNewComment('')
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось добавить комментарий')
    } finally {
      setBusy(false)
    }
  }

  const onMoveStatus = async (toStatus: string) => {
    if (!summary || !detail) return
    setBusy(true)
    try {
      await appServices.board.moveStory({
        productId: summary.product.id,
        storyId: detail.story.id,
        toStatus: toStatus as never,
      })
      await refreshWorkspace()
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось изменить статус')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        type="button"
        aria-label="Закрыть панель"
        className="absolute inset-0 bg-black/30"
        onClick={close}
      />
      <aside className="relative flex h-full w-full max-w-[520px] flex-col overflow-hidden border-l border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] shadow-xl">
        {!detail ? (
          <div className="p-6 text-[var(--color-text-tertiary)]">
            {error ?? 'Загрузка User Story…'}
          </div>
        ) : (
          <>
            <header className="flex items-start justify-between gap-2 border-b border-[var(--color-border-subtle)] px-4 py-3">
              <div>
                <div className="font-mono text-[11px] text-[var(--color-text-tertiary)]">
                  {detail.story.key}
                </div>
                <h2 className="text-[15px] font-semibold">{detail.story.title}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <Badge>{labelStoryStatus(detail.story.status)}</Badge>
                  <Badge tone="accent">{labelStoryType(detail.story.storyType)}</Badge>
                  {detail.story.priority && (
                    <Badge tone="warning">{labelStoryPriority(detail.story.priority)}</Badge>
                  )}
                  <Badge tone="success">{detail.progress}%</Badge>
                </div>
              </div>
              <Button variant="ghost" size="icon" aria-label="Закрыть" onClick={close}>
                <X className="h-4 w-4" />
              </Button>
            </header>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
              {error && <div className="text-[12px] text-[var(--color-danger)]">{error}</div>}

              <section>
                <h3 className="mb-1.5 text-[12px] font-semibold text-[var(--color-text-tertiary)] uppercase">
                  Карточка
                </h3>
                {detail.story.asA || detail.story.iWant || detail.story.soThat ? (
                  <div className="space-y-1 text-[13px]">
                    {detail.story.asA && <p>Как <b>{detail.story.asA}</b></p>}
                    {detail.story.iWant && <p>я хочу <b>{detail.story.iWant}</b></p>}
                    {detail.story.soThat && <p>чтобы <b>{detail.story.soThat}</b></p>}
                  </div>
                ) : (
                  <p className="text-[13px] text-[var(--color-text-secondary)]">
                    {detail.story.description ?? 'Описание не заполнено'}
                  </p>
                )}
              </section>

              <section>
                <h3 className="mb-1.5 text-[12px] font-semibold text-[var(--color-text-tertiary)] uppercase">
                  Смена статуса
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {['draft', 'refining', 'ready', 'planned', 'in_progress', 'in_review', 'done']
                    .filter((status) => status !== detail.story.status)
                    .map((status) => (
                      <Button
                        key={status}
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={() => void onMoveStatus(status)}
                      >
                        → {labelStoryStatus(status)}
                      </Button>
                    ))}
                </div>
              </section>

              <section>
                <h3 className="mb-1.5 text-[12px] font-semibold text-[var(--color-text-tertiary)] uppercase">
                  Критерии приёмки ({detail.acceptanceCriteria.length})
                </h3>
                <ul className="space-y-1">
                  {detail.acceptanceCriteria.map((criterion) => (
                    <li key={criterion.id} className="flex items-start gap-2 text-[13px]">
                      <input
                        type="checkbox"
                        checked={criterion.isSatisfied}
                        onChange={() => void toggleAcceptanceCriterion(criterion.id)}
                        className="mt-0.5"
                      />
                      <span className={cn(criterion.isSatisfied && 'text-[var(--color-text-tertiary)] line-through')}>
                        {criterion.text}
                      </span>
                    </li>
                  ))}
                  {detail.acceptanceCriteria.length === 0 && (
                    <li className="text-[12px] text-[var(--color-text-tertiary)]">Критерии пока не заданы</li>
                  )}
                </ul>
                <div className="mt-2 flex gap-1.5">
                  <input
                    value={newAc}
                    onChange={(event) => setNewAc(event.target.value)}
                    placeholder="Новый критерий приёмки"
                    className="h-8 flex-1 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-app)] px-2.5 text-[13px] outline-none focus:border-[var(--color-accent)]"
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') void addAcceptanceCriterion()
                    }}
                  />
                  <Button size="sm" variant="secondary" disabled={busy} onClick={() => void addAcceptanceCriterion()}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </section>

              <section>
                <h3 className="mb-1.5 text-[12px] font-semibold text-[var(--color-text-tertiary)] uppercase">
                  Definition of Done ({detail.definitionOfDoneItems.length})
                </h3>
                <ul className="space-y-1">
                  {detail.definitionOfDoneItems.map((item) => (
                    <li key={item.id} className="flex items-start gap-2 text-[13px]">
                      <input
                        type="checkbox"
                        checked={item.isSatisfied}
                        onChange={() => void toggleDodItem(item.id)}
                        className="mt-0.5"
                      />
                      <span className={cn(item.isSatisfied && 'text-[var(--color-text-tertiary)] line-through')}>
                        {item.text}
                      </span>
                    </li>
                  ))}
                  {detail.definitionOfDoneItems.length === 0 && (
                    <li className="text-[12px] text-[var(--color-text-tertiary)]">Пункты DoD не заданы</li>
                  )}
                </ul>
                <div className="mt-2 flex gap-1.5">
                  <input
                    value={newDod}
                    onChange={(event) => setNewDod(event.target.value)}
                    placeholder="Новый пункт Definition of Done"
                    className="h-8 flex-1 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-app)] px-2.5 text-[13px] outline-none focus:border-[var(--color-accent)]"
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') void addDodItem()
                    }}
                  />
                  <Button size="sm" variant="secondary" disabled={busy} onClick={() => void addDodItem()}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </section>

              <section>
                <h3 className="mb-1.5 text-[12px] font-semibold text-[var(--color-text-tertiary)] uppercase">
                  Задачи ({detail.workItems.length})
                </h3>
                <ul className="space-y-1.5">
                  {detail.workItems.map((item) => {
                    const isExpanded = expandedWorkItemId === item.id
                    return (
                      <li
                        key={item.id}
                        className="rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-app)]"
                      >
                        <button
                          type="button"
                          className="flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left"
                          onClick={() => setExpandedWorkItemId(isExpanded ? null : item.id)}
                        >
                          <span className="flex items-center gap-1.5 text-[13px]">
                            {isExpanded ? (
                              <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                            )}
                            <span className="font-mono text-[11px] text-[var(--color-text-tertiary)]">
                              {item.key}
                            </span>
                            {item.title}
                          </span>
                          <Badge>{labelWorkItemStatus(item.status)}</Badge>
                        </button>
                        {isExpanded && (
                          <div className="space-y-1.5 border-t border-[var(--color-border-subtle)] px-2.5 py-2 text-[12px] text-[var(--color-text-secondary)]">
                            <div>
                              Оценка: {item.estimateHours} ч · Потрачено: {item.spentHours} ч
                            </div>
                            {item.goal && (
                              <div>
                                <span className="font-medium text-[var(--color-text-primary)]">Цель: </span>
                                {item.goal}
                              </div>
                            )}
                            {item.expectedResult && (
                              <div>
                                <span className="font-medium text-[var(--color-text-primary)]">Результат: </span>
                                {item.expectedResult}
                              </div>
                            )}
                            {item.description && (
                              <pre className="whitespace-pre-wrap font-sans text-[12px]">{item.description}</pre>
                            )}
                          </div>
                        )}
                      </li>
                    )
                  })}
                  {detail.workItems.length === 0 && (
                    <li className="text-[12px] text-[var(--color-text-tertiary)]">Задачи ещё не сгенерированы</li>
                  )}
                </ul>
              </section>

              <section>
                <h3 className="mb-1.5 text-[12px] font-semibold text-[var(--color-text-tertiary)] uppercase">
                  Комментарии ({detail.comments.length})
                </h3>
                <ul className="space-y-2">
                  {detail.comments.map((comment) => (
                    <li
                      key={comment.id}
                      className="rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-app)] px-2.5 py-1.5 text-[13px]"
                    >
                      <div className="mb-0.5 flex items-center justify-between text-[11px] text-[var(--color-text-tertiary)]">
                        <span>{comment.author}</span>
                        <span>{new Date(comment.createdAt).toLocaleString('ru-RU')}</span>
                      </div>
                      {comment.body}
                    </li>
                  ))}
                  {detail.comments.length === 0 && (
                    <li className="text-[12px] text-[var(--color-text-tertiary)]">Комментариев пока нет</li>
                  )}
                </ul>
                <div className="mt-2 flex gap-1.5">
                  <input
                    value={newComment}
                    onChange={(event) => setNewComment(event.target.value)}
                    placeholder="Написать комментарий"
                    className="h-8 flex-1 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-app)] px-2.5 text-[13px] outline-none focus:border-[var(--color-accent)]"
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') void addComment()
                    }}
                  />
                  <Button size="sm" variant="secondary" disabled={busy} onClick={() => void addComment()}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </section>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
