import { Link } from 'react-router-dom'
import { CreateStoryForm } from '@/features/create-story/ui/CreateStoryForm'
import { useWorkspaceStore } from '@/features/workspace/model/workspace-store'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/cn'

const linkButtonClass =
  'inline-flex h-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-bg-subtle)] px-3 text-[13px] font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-border-subtle)]'

export function TodayPage() {
  const summary = useWorkspaceStore((s) => s.summary)
  const stories = useWorkspaceStore((s) => s.stories)
  const resetDemoData = useWorkspaceStore((s) => s.resetDemoData)

  const recent = stories.slice(-5).reverse()

  return (
    <section className="flex h-full flex-col gap-4 p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight">Сегодня</h1>
          <p className="text-[var(--color-text-secondary)]">
            {summary?.product.name} · {summary?.quarter?.key ?? '—'} ·{' '}
            {summary?.sprint?.name ?? 'Нет активного спринта'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="accent">MVP этапы 1–14</Badge>
          <Button variant="ghost" size="sm" onClick={() => void resetDemoData()}>
            Сбросить демо
          </Button>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4">
          <h2 className="mb-3 text-[13px] font-semibold">Пульс рабочего пространства</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ['User Story', summary?.counts.stories ?? 0],
              ['Задачи', summary?.counts.workItems ?? 0],
              ['Зависимости', summary?.counts.dependencies ?? 0],
              ['Шаблоны', summary?.counts.templates ?? 0],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                className="rounded-[var(--radius-sm)] bg-[var(--color-bg-app)] px-3 py-2"
              >
                <div className="text-[11px] text-[var(--color-text-tertiary)]">{label}</div>
                <div className="text-lg font-semibold">{value}</div>
              </div>
            ))}
          </div>

          <h2 className="mt-5 mb-2 text-[13px] font-semibold">Недавние User Story</h2>
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

        <div className="space-y-4">
          <CreateStoryForm />
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4">
            <h2 className="mb-2 text-[13px] font-semibold">Продолжить</h2>
            <div className="flex flex-col gap-2">
              <Link className={cn(linkButtonClass)} to="/deliver/backlog">
                Открыть бэклог
              </Link>
              <Link className={cn(linkButtonClass)} to="/system/templates">
                Шаблоны процессов
              </Link>
              <Link className={cn(linkButtonClass)} to="/plan/sprint">
                Планирование спринта
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
