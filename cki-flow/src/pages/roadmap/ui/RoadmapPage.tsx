import { useEffect, useMemo, useState } from 'react'
import { appServices } from '@/application/composition'
import type { RoadmapBar } from '@/application/services/roadmap-service'
import { useWorkspaceStore } from '@/features/workspace/model/workspace-store'
import { Badge } from '@/shared/ui/badge'

function dayOffset(start: string, date: string): number {
  const a = new Date(start).getTime()
  const b = new Date(date).getTime()
  return Math.max(0, Math.round((b - a) / (24 * 60 * 60 * 1000)))
}

function spanDays(start: string, end: string): number {
  return Math.max(1, dayOffset(start, end) + 1)
}

export function RoadmapPage() {
  const summary = useWorkspaceStore((s) => s.summary)
  const [bars, setBars] = useState<RoadmapBar[]>([])
  const [rangeStart, setRangeStart] = useState('2026-07-01')
  const [rangeEnd, setRangeEnd] = useState('2026-09-30')
  const [level, setLevel] = useState<'all' | 'initiative' | 'story'>('all')

  useEffect(() => {
    if (!summary) return
    void appServices.roadmap.getBars(summary.product.id).then((result) => {
      setBars(result.bars)
      setRangeStart(result.rangeStart)
      setRangeEnd(result.rangeEnd)
    })
  }, [summary, summary?.counts.stories, summary?.counts.workItems])

  const totalDays = useMemo(() => spanDays(rangeStart, rangeEnd), [rangeStart, rangeEnd])
  const visible = bars.filter((bar) => level === 'all' || bar.kind === level)

  return (
    <section className="flex h-full flex-col gap-4 p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Roadmap</h1>
          <p className="text-[var(--color-text-secondary)]">
            Автоматически из forecast WorkItems · {rangeStart} → {rangeEnd}
          </p>
        </div>
        <div className="flex gap-1">
          {(['all', 'initiative', 'story'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setLevel(value)}
              className={`rounded-[6px] px-2 py-1 text-[12px] ${
                level === value
                  ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent)]'
                  : 'text-[var(--color-text-secondary)]'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </header>

      <div className="overflow-auto rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4">
        {visible.length === 0 ? (
          <p className="text-[var(--color-text-tertiary)]">
            Нет forecast-дат. Создайте Story и/или commit в Sprint.
          </p>
        ) : (
          <div className="space-y-3">
            {visible.map((bar) => {
              const left = (dayOffset(rangeStart, bar.start) / totalDays) * 100
              const width = (spanDays(bar.start, bar.end) / totalDays) * 100
              return (
                <div key={`${bar.kind}-${bar.id}`} className="grid grid-cols-[180px_1fr] items-center gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-[12px] font-medium">{bar.label}</div>
                    <div className="flex items-center gap-1 text-[10px] text-[var(--color-text-tertiary)]">
                      <Badge tone={bar.kind === 'initiative' ? 'accent' : 'neutral'}>{bar.kind}</Badge>
                      <span>{bar.subtitle}</span>
                    </div>
                  </div>
                  <div className="relative h-7 rounded bg-[var(--color-bg-subtle)]">
                    <div
                      className="absolute top-1 bottom-1 rounded-[4px] bg-[var(--color-accent)]/80"
                      style={{ left: `${left}%`, width: `${Math.max(width, 1.5)}%` }}
                      title={`${bar.start} → ${bar.end}`}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
