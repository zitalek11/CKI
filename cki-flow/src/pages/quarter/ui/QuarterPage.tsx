import { useCallback, useEffect, useState } from 'react'
import { appServices } from '@/application/composition'
import type { Quarter } from '@/domain/model/entities'
import { useWorkspaceStore } from '@/features/workspace/model/workspace-store'
import { labelHealth, labelOrRaw, labelQuarterStatus } from '@/shared/lib/labels'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'

type Overview = Awaited<ReturnType<typeof appServices.quarters.getOverview>>

const inputClass =
  'rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-app)] px-2 py-1 text-[12px] outline-none focus:border-[var(--color-accent)]'

export function QuarterPage() {
  const summary = useWorkspaceStore((s) => s.summary)
  const refreshWorkspace = useWorkspaceStore((s) => s.refresh)
  const [data, setData] = useState<Overview | null>(null)
  const [quarters, setQuarters] = useState<Quarter[]>([])
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    year: String(new Date().getFullYear()),
    index: '3' as '1' | '2' | '3' | '4',
    startDate: '',
    endDate: '',
  })
  const [copyFromId, setCopyFromId] = useState('')
  const [carryFromId, setCarryFromId] = useState('')

  const reload = useCallback(async () => {
    if (!summary) return
    try {
      const [overview, all] = await Promise.all([
        appServices.quarters.getOverview(summary.product.id),
        appServices.quarters.listAll(summary.product.id),
      ])
      setData(overview)
      setQuarters(all.filter((item) => !item.archivedAt))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить квартал')
    }
  }, [summary])

  useEffect(() => {
    void reload()
  }, [reload, summary?.counts.stories, summary?.quarter?.id])

  const createQuarter = async () => {
    if (!summary) return
    try {
      await appServices.quarters.create({
        productId: summary.product.id,
        year: Number(form.year),
        index: Number(form.index) as 1 | 2 | 3 | 4,
        startDate: form.startDate,
        endDate: form.endDate,
      })
      setShowCreate(false)
      setMessage('Квартал создан')
      await refreshWorkspace()
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось создать квартал')
    }
  }

  const activate = async (quarterId: string) => {
    if (!summary) return
    try {
      await appServices.quarters.activate({ productId: summary.product.id, quarterId })
      setMessage('Активный квартал переключён')
      await refreshWorkspace()
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось активировать квартал')
    }
  }

  const archive = async (quarterId: string) => {
    if (!summary) return
    try {
      await appServices.quarters.archive({ productId: summary.product.id, quarterId })
      setMessage('Квартал в архиве')
      await refreshWorkspace()
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось архивировать квартал')
    }
  }

  const copyStructure = async () => {
    if (!summary?.quarter || !copyFromId) return
    try {
      const result = await appServices.quarters.copyStructure({
        productId: summary.product.id,
        sourceQuarterId: copyFromId,
        targetQuarterId: summary.quarter.id,
      })
      setMessage(`Скопировано целей: ${result.goalsCopied}`)
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось скопировать структуру')
    }
  }

  const carryOver = async () => {
    if (!summary?.quarter || !carryFromId) return
    try {
      const result = await appServices.quarters.carryOverIncomplete({
        productId: summary.product.id,
        fromQuarterId: carryFromId,
        toQuarterId: summary.quarter.id,
      })
      setMessage(`Перенесено User Story: ${result.storiesMoved}`)
      await refreshWorkspace()
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось перенести User Story')
    }
  }

  if (error && !data) {
    return <div className="p-6 text-[var(--color-danger)]">{error}</div>
  }
  if (!data) {
    return <div className="p-6 text-[var(--color-text-tertiary)]">Загрузка квартала…</div>
  }

  const healthTone =
    data.health === 'on_track' ? 'success' : data.health === 'at_risk' ? 'warning' : 'danger'

  return (
    <section className="flex h-full flex-col gap-4 p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">{data.quarter.key}</h1>
          <p className="text-[var(--color-text-secondary)]">
            {data.quarter.startDate} → {data.quarter.endDate} · {data.counts.initiatives} инициатив ·{' '}
            {data.counts.stories} User Story
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={healthTone}>Состояние: {labelHealth(data.health)}</Badge>
          <Button size="sm" variant="secondary" onClick={() => setShowCreate((v) => !v)}>
            Новый квартал
          </Button>
        </div>
      </header>

      {error && <div className="text-[12px] text-[var(--color-danger)]">{error}</div>}
      {message && <div className="text-[12px] text-[var(--color-success)]">{message}</div>}

      {showCreate && (
        <div className="grid gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4 md:grid-cols-4">
          <input
            className={inputClass}
            placeholder="Год"
            value={form.year}
            onChange={(e) => setForm({ ...form, year: e.target.value })}
          />
          <select
            className={inputClass}
            value={form.index}
            onChange={(e) => setForm({ ...form, index: e.target.value as typeof form.index })}
          >
            <option value="1">Q1</option>
            <option value="2">Q2</option>
            <option value="3">Q3</option>
            <option value="4">Q4</option>
          </select>
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
          <div className="md:col-span-4">
            <Button size="sm" onClick={() => void createQuarter()}>
              Создать
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[13px] font-semibold">Менеджер кварталов</h2>
          <div className="flex flex-wrap gap-2">
            <select className={inputClass} value={copyFromId} onChange={(e) => setCopyFromId(e.target.value)}>
              <option value="">Копировать структуру из…</option>
              {quarters
                .filter((item) => item.id !== data.quarter.id)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.key}
                  </option>
                ))}
            </select>
            <Button size="sm" variant="ghost" disabled={!copyFromId} onClick={() => void copyStructure()}>
              Копировать
            </Button>
            <select className={inputClass} value={carryFromId} onChange={(e) => setCarryFromId(e.target.value)}>
              <option value="">Перенести незавершённые из…</option>
              {quarters
                .filter((item) => item.id !== data.quarter.id)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.key}
                  </option>
                ))}
            </select>
            <Button size="sm" variant="ghost" disabled={!carryFromId} onClick={() => void carryOver()}>
              Перенести
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          {quarters.map((quarter) => (
            <div
              key={quarter.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-app)] px-3 py-2"
            >
              <div>
                <div className="font-medium">
                  {quarter.key}{' '}
                  {quarter.id === data.quarter.id && <Badge tone="accent">активный</Badge>}
                </div>
                <div className="text-[12px] text-[var(--color-text-secondary)]">
                  {quarter.startDate} → {quarter.endDate} · {labelQuarterStatus(quarter.status)}
                </div>
              </div>
              <div className="flex gap-1">
                {quarter.id !== data.quarter.id && (
                  <Button size="sm" variant="secondary" onClick={() => void activate(quarter.id)}>
                    Активировать
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => void archive(quarter.id)}>
                  Архив
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {data.goals.map((goal) => (
          <article
            key={goal.id}
            className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4"
          >
            <div className="text-[11px] text-[var(--color-text-tertiary)] uppercase">
              {labelOrRaw(goal.status)}
            </div>
            <h2 className="mt-1 font-semibold">{goal.title}</h2>
            <p className="mt-1 text-[12px] text-[var(--color-text-secondary)]">{goal.statement}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4">
          <h2 className="mb-3 text-[13px] font-semibold">Инициатива → Epic</h2>
          <div className="space-y-3">
            {data.tree.map((node) => (
              <div key={node.initiative.id}>
                <div className="font-medium">
                  {node.initiative.key} · {node.initiative.title}
                </div>
                <div className="mt-1 space-y-1 border-l border-[var(--color-border-subtle)] pl-3">
                  {node.epics.map((epicNode) => (
                    <div
                      key={epicNode.epic.id}
                      className="flex items-center justify-between text-[13px] text-[var(--color-text-secondary)]"
                    >
                      <span>
                        {epicNode.epic.key} · {epicNode.epic.title}
                      </span>
                      <span>
                        {epicNode.storyCount} US · {epicNode.progress}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4">
          <h2 className="mb-3 text-[13px] font-semibold">Давление по ролям (квартал)</h2>
          <div className="space-y-2">
            {data.rolePressure.map((row) => (
              <div key={row.code} className="flex items-center justify-between text-[13px]">
                <span>{row.code}</span>
                <span className="text-[var(--color-text-secondary)]">
                  {row.demandHours} ч / {Math.round(row.supplyHours)} ч ·{' '}
                  {Math.round(row.utilization * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
