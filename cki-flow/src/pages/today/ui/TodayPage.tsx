import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { appServices } from '@/application/composition'
import { CreateStoryForm } from '@/features/create-story/ui/CreateStoryForm'
import { useWorkspaceStore } from '@/features/workspace/model/workspace-store'
import { labelHealth, labelStoryStatus } from '@/shared/lib/labels'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/cn'

const linkButtonClass =
  'inline-flex h-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-bg-subtle)] px-3 text-[13px] font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-border-subtle)]'

type Pulse = Awaited<ReturnType<typeof appServices.analytics.getPulse>>

export function TodayPage() {
  const summary = useWorkspaceStore((s) => s.summary)
  const stories = useWorkspaceStore((s) => s.stories)
  const resetDemoData = useWorkspaceStore((s) => s.resetDemoData)

  const [pulse, setPulse] = useState<Pulse | null>(null)

  useEffect(() => {
    if (!summary) return
    void appServices.analytics.getPulse(summary.product.id).then(setPulse)
  }, [summary, summary?.counts.stories, summary?.sprint?.id, summary?.quarter?.id])

  const recent = stories.slice(-5).reverse()
  const overloadedRoles = pulse?.roleBars.filter((row) => row.utilization > 1) ?? []
  const overloadedPeople = pulse?.overloadedEmployees ?? []
  const healthTone =
    pulse?.health === 'on_track' ? 'success' : pulse?.health === 'at_risk' ? 'warning' : 'danger'

  return (
    <section className="flex h-full flex-col gap-4 p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight">Сегодня</h1>
          <p className="text-[var(--color-text-secondary)]">
            {summary?.product.name} · {summary?.quarter?.key ?? 'Нет активного квартала'} ·{' '}
            {summary?.sprint?.name ?? 'Нет активного спринта'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pulse && <Badge tone={healthTone}>Состояние: {labelHealth(pulse.health)}</Badge>}
          <Button variant="ghost" size="sm" onClick={() => void resetDemoData()}>
            Сбросить демо
          </Button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Активный квартал', summary?.quarter?.key ?? '—'],
          ['Активный спринт', summary?.sprint?.name ?? '—'],
          ['User Story', summary?.counts.stories ?? 0],
          ['Задачи', summary?.counts.workItems ?? 0],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] px-3 py-2.5"
          >
            <div className="text-[11px] text-[var(--color-text-tertiary)]">{label}</div>
            <div className="truncate text-lg font-semibold">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [
            'Capacity команды',
            pulse
              ? `${Math.round((pulse.teamCapacity?.utilization ?? 0) * 100)}%`
              : '—',
          ],
          ['Заблокировано задач', pulse?.blocked ?? 0],
          ['Блокирующие зависимости', pulse?.blockingDependencies ?? 0],
          [
            'Статус релиза',
            pulse?.releaseReadiness
              ? `${pulse.releaseReadiness.release.name} · ${pulse.releaseReadiness.readinessPercent}%`
              : '—',
          ],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] px-3 py-2.5"
          >
            <div className="text-[11px] text-[var(--color-text-tertiary)]">{label}</div>
            <div className="truncate text-lg font-semibold">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="flex flex-col gap-4">
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4">
            <h2 className="mb-3 text-[13px] font-semibold">Загрузка по ролям</h2>
            {!pulse || pulse.roleBars.length === 0 ? (
              <p className="text-[12px] text-[var(--color-text-tertiary)]">Нет данных по загрузке</p>
            ) : (
              <div className="space-y-1.5">
                {pulse.roleBars.map((row) => (
                  <div key={row.code} className="flex items-center justify-between text-[13px]">
                    <span className="flex items-center gap-1.5">
                      {row.code}
                      {row.utilization > 1 && <Badge tone="danger">перегрузка</Badge>}
                    </span>
                    <span className="text-[var(--color-text-secondary)]">
                      {row.demandHours} ч / {Math.round(row.supplyHours)} ч ·{' '}
                      {Math.round(row.utilization * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
            {overloadedRoles.length > 0 && (
              <p className="mt-2 text-[12px] text-[var(--color-danger)]">
                Перегружено ролей: {overloadedRoles.length} ({overloadedRoles.map((row) => row.code).join(', ')})
              </p>
            )}
          </div>

          <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4">
            <h2 className="mb-2 text-[13px] font-semibold">Перегруженные сотрудники</h2>
            {overloadedPeople.length === 0 ? (
              <p className="text-[12px] text-[var(--color-text-tertiary)]">Перегрузок нет</p>
            ) : (
              <ul className="space-y-1.5">
                {overloadedPeople.map((person) => (
                  <li
                    key={person.id}
                    className="flex items-center justify-between text-[13px]"
                  >
                    <span>{person.displayName}</span>
                    <span className="text-[var(--color-danger)]">
                      {person.demandHours} ч / {person.supplyHours} ч ·{' '}
                      {Math.round(person.utilization * 100)}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4">
            <h2 className="mb-2 text-[13px] font-semibold">Недавние User Story</h2>
            {recent.length === 0 ? (
              <p className="text-[var(--color-text-tertiary)]">
                Пока нет User Story — создайте первую справа.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {recent.map((story) => (
                  <li
                    key={story.id}
                    className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] px-3 py-2"
                  >
                    <div>
                      <span className="font-mono text-[11px] text-[var(--color-text-tertiary)]">
                        {story.key}
                      </span>
                      <div className="font-medium">{story.title}</div>
                      <Badge>{labelStoryStatus(story.status)}</Badge>
                    </div>
                    <div className="text-right text-[12px] text-[var(--color-text-secondary)]">
                      <div>{story.workItemCount} задач</div>
                      <div>{story.remainingHours} ч</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <CreateStoryForm compact />

          {pulse?.releaseReadiness && (
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-[13px] font-semibold">Готовность релиза</h2>
                <Link className="text-[12px] text-[var(--color-accent)]" to="/deliver/releases">
                  Открыть
                </Link>
              </div>
              <div className="mb-1 flex items-center justify-between text-[13px]">
                <span>{pulse.releaseReadiness.release.name}</span>
                <Badge
                  tone={
                    pulse.releaseReadiness.riskLevel === 'low'
                      ? 'success'
                      : pulse.releaseReadiness.riskLevel === 'medium'
                        ? 'warning'
                        : 'danger'
                  }
                >
                  {pulse.releaseReadiness.readinessPercent}%
                </Badge>
              </div>
              <div className="space-y-1">
                {pulse.releaseReadiness.gates.map((gate) => (
                  <div key={gate.key} className="flex items-center justify-between text-[12px]">
                    <span className={cn(!gate.passed && 'text-[var(--color-danger)]')}>{gate.label}</span>
                    <span className="text-[var(--color-text-tertiary)]">{gate.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4">
            <h2 className="mb-2 text-[13px] font-semibold">Продолжить</h2>
            <div className="flex flex-col gap-2">
              <Link className={cn(linkButtonClass)} to="/deliver/releases">
                Активный релиз
              </Link>
              <Link className={cn(linkButtonClass)} to="/deliver/backlog">
                Открыть бэклог
              </Link>
              <Link className={cn(linkButtonClass)} to="/deliver/board">
                Доска
              </Link>
              <Link className={cn(linkButtonClass)} to="/plan/sprint">
                Планирование спринта
              </Link>
              <Link className={cn(linkButtonClass)} to="/system/team">
                Команда
              </Link>
              <Link className={cn(linkButtonClass)} to="/system/templates">
                Шаблоны процессов
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
