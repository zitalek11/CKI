import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'

export function TodayPage() {
  return (
    <section className="flex h-full flex-col gap-4 p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight">Today</h1>
          <p className="text-[var(--color-text-secondary)]">
            Сигналы и действия на сейчас — главный экран PM по UX.
          </p>
        </div>
        <Badge tone="warning">At risk · scaffold</Badge>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4">
          <h2 className="mb-3 text-[13px] font-semibold">Needs decision</h2>
          <ul className="space-y-2">
            {[
              'SA overload 124% in Sprint 4',
              'Release 2.4 — QA gate red',
              '2 stories blocked > 3 days',
            ].map((item) => (
              <li
                key={item}
                className="rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-app)] px-3 py-2 text-[var(--color-text-secondary)]"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4">
          <h2 className="mb-3 text-[13px] font-semibold">One-click actions</h2>
          <div className="flex flex-col gap-2">
            <Button variant="primary" disabled>
              New User Story
            </Button>
            <Button disabled>Open Sprint Planning</Button>
            <Button disabled>Open Load</Button>
          </div>
          <p className="mt-4 text-[12px] text-[var(--color-text-tertiary)]">
            Кнопки активируются после Domain Layer и экранов планирования.
          </p>
        </div>
      </div>
    </section>
  )
}
