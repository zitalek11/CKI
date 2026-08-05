import type { ReactNode } from 'react'
import { Badge } from '@/shared/ui/badge'

type PlaceholderPageProps = {
  title: string
  description: string
  stageHint: string
  children?: ReactNode
}

export function PlaceholderPage({ title, description, stageHint, children }: PlaceholderPageProps) {
  return (
    <section className="flex h-full flex-col gap-4 p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight text-[var(--color-text-primary)]">
            {title}
          </h1>
          <p className="max-w-2xl text-[var(--color-text-secondary)]">{description}</p>
        </div>
        <Badge tone="accent">{stageHint}</Badge>
      </header>
      <div className="flex-1 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-6">
        {children ?? (
          <p className="text-[var(--color-text-tertiary)]">
            Экран-заглушка этапа 1. Бизнес-логика и данные появятся на следующих этапах.
          </p>
        )}
      </div>
    </section>
  )
}
