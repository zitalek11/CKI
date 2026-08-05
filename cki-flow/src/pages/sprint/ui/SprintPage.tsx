import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { appServices } from '@/application/composition'
import type { SprintBoardItem } from '@/application/services/sprint-service'
import type { Sprint } from '@/domain/model/entities'
import { calculateRoleDemand } from '@/domain/engines/capacity/demand'
import { useWorkspaceStore } from '@/features/workspace/model/workspace-store'
import { labelSprintStatus } from '@/shared/lib/labels'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'

const inputClass =
  'rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-app)] px-2 py-1 text-[12px] outline-none focus:border-[var(--color-accent)]'

export function SprintPage() {
  const summary = useWorkspaceStore((s) => s.summary)
  const refreshWorkspace = useWorkspaceStore((s) => s.refresh)
  const [ready, setReady] = useState<SprintBoardItem[]>([])
  const [committed, setCommitted] = useState<SprintBoardItem[]>([])
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [loadByRole, setLoadByRole] = useState<Array<{ code: string; hours: number }>>([])
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    goal: '',
  })
  const [carryFromId, setCarryFromId] = useState('')

  const reload = useCallback(async () => {
    if (!summary) return
    const productId = summary.product.id
    const [readyItems, committedItems, allSprints] = await Promise.all([
      appServices.sprints.listReadyBacklog(productId),
      appServices.sprints.listCommitted(productId),
      appServices.sprints.listAll(productId),
    ])
    setReady(readyItems)
    setCommitted(committedItems)
    setSprints(allSprints.filter((item) => !item.archivedAt))

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
  }, [reload, summary?.counts.stories, summary?.sprint?.id])

  const commit = async (storyId: string) => {
    if (!summary) return
    setBusyId(storyId)
    setError(null)
    try {
      await appServices.sprints.commitStory({ productId: summary.product.id, storyId })
      await refreshWorkspace()
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось добавить в спринт')
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
      setError(err instanceof Error ? err.message : 'Не удалось убрать из спринта')
    } finally {
      setBusyId(null)
    }
  }

  const createSprint = async () => {
    if (!summary?.quarter) {
      setError('Нет активного квартала для нового спринта')
      return
    }
    setError(null)
    try {
      await appServices.sprints.create({
        productId: summary.product.id,
        quarterId: summary.quarter.id,
        name: form.name,
        startDate: form.startDate,
        endDate: form.endDate,
        goal: form.goal || undefined,
      })
      setShowCreate(false)
      setForm({ name: '', startDate: '', endDate: '', goal: '' })
      setMessage('Спринт создан')
      await refreshWorkspace()
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось создать спринт')
    }
  }

  const activate = async (sprintId: string) => {
    if (!summary) return
    try {
      await appServices.sprints.activate({ productId: summary.product.id, sprintId })
      setMessage('Активный спринт переключён')
      await refreshWorkspace()
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось активировать спринт')
    }
  }

  const closeSprint = async (sprintId: string) => {
    if (!summary) return
    try {
      await appServices.sprints.close({ productId: summary.product.id, sprintId })
      setMessage('Спринт закрыт')
      await refreshWorkspace()
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось закрыть спринт')
    }
  }

  const archiveSprint = async (sprintId: string) => {
    if (!summary) return
    try {
      await appServices.sprints.archive({ productId: summary.product.id, sprintId })
      setMessage('Спринт в архиве')
      await refreshWorkspace()
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось архивировать спринт')
    }
  }

  const copySprint = async (sourceSprintId: string) => {
    if (!summary) return
    const source = sprints.find((item) => item.id === sourceSprintId)
    if (!source) return
    const start = prompt('Дата начала копии (YYYY-MM-DD)', source.endDate)
    const end = prompt('Дата окончания копии (YYYY-MM-DD)')
    if (!start || !end) return
    try {
      await appServices.sprints.copyFrom({
        productId: summary.product.id,
        sourceSprintId,
        name: `${source.name} (копия)`,
        startDate: start,
        endDate: end,
      })
      setMessage('Спринт скопирован')
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось скопировать спринт')
    }
  }

  const carryOver = async () => {
    if (!summary?.sprint || !carryFromId) return
    try {
      const result = await appServices.sprints.carryOverIncomplete({
        productId: summary.product.id,
        fromSprintId: carryFromId,
        toSprintId: summary.sprint.id,
      })
      setMessage(`Перенесено User Story: ${result.storiesMoved}`)
      await refreshWorkspace()
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось перенести задачи')
    }
  }

  return (
    <section className="flex h-full flex-col gap-4 p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight">Спринт</h1>
          <p className="text-[var(--color-text-secondary)]">
            {summary?.sprint?.name ?? 'Нет активного спринта'} · {summary?.sprint?.startDate} →{' '}
            {summary?.sprint?.endDate}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {loadByRole.map((row) => (
            <Badge key={row.code} tone="accent">
              {row.code} {row.hours} ч
            </Badge>
          ))}
          <Button size="sm" variant="secondary" onClick={() => setShowCreate((v) => !v)}>
            Новый спринт
          </Button>
        </div>
      </header>

      {error && (
        <div className="rounded-[var(--radius-sm)] border border-[var(--color-danger)]/30 bg-[color-mix(in_oklab,var(--color-danger)_10%,transparent)] px-3 py-2 text-[12px] text-[var(--color-danger)]">
          {error}
        </div>
      )}
      {message && <div className="text-[12px] text-[var(--color-success)]">{message}</div>}

      {showCreate && (
        <div className="grid gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4 md:grid-cols-4">
          <input
            className={inputClass}
            placeholder="Название"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            type="date"
            className={inputClass}
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          />
          <input
            type="date"
            className={inputClass}
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          />
          <input
            className={inputClass}
            placeholder="Цель спринта"
            value={form.goal}
            onChange={(e) => setForm({ ...form, goal: e.target.value })}
          />
          <div className="md:col-span-4">
            <Button size="sm" onClick={() => void createSprint()}>
              Создать
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[13px] font-semibold">Менеджер спринтов</h2>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className={inputClass}
              value={carryFromId}
              onChange={(e) => setCarryFromId(e.target.value)}
            >
              <option value="">Перенести незавершённые из…</option>
              {sprints
                .filter((item) => item.id !== summary?.sprint?.id)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
            </select>
            <Button size="sm" variant="ghost" disabled={!carryFromId} onClick={() => void carryOver()}>
              Перенести
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          {sprints.map((sprint) => (
            <div
              key={sprint.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-app)] px-3 py-2"
            >
              <div>
                <div className="font-medium">
                  {sprint.name}{' '}
                  {sprint.id === summary?.sprint?.id && <Badge tone="accent">активный</Badge>}
                </div>
                <div className="text-[12px] text-[var(--color-text-secondary)]">
                  {sprint.startDate} → {sprint.endDate} · {labelSprintStatus(sprint.status)}
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {sprint.id !== summary?.sprint?.id && (
                  <Button size="sm" variant="secondary" onClick={() => void activate(sprint.id)}>
                    Активировать
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => void copySprint(sprint.id)}>
                  Копировать
                </Button>
                {sprint.status === 'active' && (
                  <Button size="sm" variant="ghost" onClick={() => void closeSprint(sprint.id)}>
                    Закрыть
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => void archiveSprint(sprint.id)}>
                  Архив
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
        <Pane title="Готовый бэклог" count={ready.length}>
          {ready.map((item) => (
            <StoryRow
              key={item.story.id}
              item={item}
              actionLabel="В спринт"
              primary
              busy={busyId === item.story.id}
              onAction={() => void commit(item.story.id)}
            />
          ))}
        </Pane>
        <Pane title="Объём спринта" count={committed.length}>
          {committed.map((item) => (
            <StoryRow
              key={item.story.id}
              item={item}
              actionLabel="Убрать"
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
          <p className="px-1 py-6 text-center text-[12px] text-[var(--color-text-tertiary)]">
            Пусто
          </p>
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
  primary,
}: {
  item: SprintBoardItem
  actionLabel: string
  onAction: () => void
  busy: boolean
  showForecast?: boolean
  primary?: boolean
}) {
  return (
    <div className="rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-app)] px-3 py-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-mono text-[11px] text-[var(--color-text-tertiary)]">
            {item.story.key}
          </div>
          <div className="font-medium">{item.story.title}</div>
          <div className="mt-1 text-[12px] text-[var(--color-text-secondary)]">
            {item.workItemCount} задач · {item.remainingHours} ч
            {showForecast && item.forecastStart && item.forecastEnd
              ? ` · ${item.forecastStart} → ${item.forecastEnd}`
              : ''}
          </div>
        </div>
        <Button
          size="sm"
          variant={primary ? 'primary' : 'ghost'}
          disabled={busy}
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      </div>
    </div>
  )
}
