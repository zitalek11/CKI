import { useCallback, useEffect, useState } from 'react'
import { appServices } from '@/application/composition'
import { useWorkspaceStore } from '@/features/workspace/model/workspace-store'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'

type Details = Awaited<ReturnType<typeof appServices.releases.getDetails>>

export function ReleasesPage() {
  const summary = useWorkspaceStore((s) => s.summary)
  const [details, setDetails] = useState<Details | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!summary) return
    setDetails(await appServices.releases.getDetails(summary.product.id))
  }, [summary])

  useEffect(() => {
    void reload().catch((err: Error) => setError(err.message))
  }, [reload, summary?.counts.stories])

  const add = async (storyId: string) => {
    if (!details) return
    setError(null)
    try {
      await appServices.releases.addStory({ releaseId: details.release.id, storyId })
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Add failed')
    }
  }

  const remove = async (storyId: string) => {
    if (!details) return
    try {
      await appServices.releases.removeStory({ releaseId: details.release.id, storyId })
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Remove failed')
    }
  }

  if (!details) {
    return <div className="p-6 text-[var(--color-text-tertiary)]">Loading release…</div>
  }

  const { release, readiness, stories, candidates, memberships } = details
  const riskTone =
    readiness.riskLevel === 'low'
      ? 'success'
      : readiness.riskLevel === 'medium'
        ? 'warning'
        : 'danger'

  return (
    <section className="flex h-full flex-col gap-4 p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">
            {release.name} · {release.versionName}
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            {release.status} · plan {release.plannedDate ?? '—'}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge tone="accent">Readiness {readiness.readinessPercent}%</Badge>
          <Badge tone="accent">Scope {readiness.completionPercent}%</Badge>
          <Badge tone={riskTone}>Risk {readiness.riskLevel}</Badge>
        </div>
      </header>

      {error && <div className="text-[12px] text-[var(--color-danger)]">{error}</div>}

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4">
          <h2 className="mb-3 text-[13px] font-semibold">Gates</h2>
          <ul className="space-y-2">
            {readiness.gates.map((gate) => (
              <li
                key={gate.key}
                className="flex items-start justify-between gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] px-3 py-2"
              >
                <div>
                  <div className="font-medium">{gate.label}</div>
                  <div className="text-[12px] text-[var(--color-text-secondary)]">{gate.detail}</div>
                </div>
                <Badge tone={gate.passed ? 'success' : 'danger'}>
                  {gate.passed ? 'pass' : 'fail'}
                </Badge>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4">
          <h2 className="mb-3 text-[13px] font-semibold">Membership</h2>
          <div className="space-y-2">
            {stories.length === 0 && (
              <p className="text-[12px] text-[var(--color-text-tertiary)]">Пока пусто — добавьте Story.</p>
            )}
            {stories.map((story) => {
              const membership = memberships.find((item) => item.userStoryId === story.id)
              return (
                <div
                  key={story.id}
                  className="flex items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] px-3 py-2"
                >
                  <div>
                    <div className="font-mono text-[11px] text-[var(--color-text-tertiary)]">
                      {story.key}
                    </div>
                    <div className="text-[13px] font-medium">{story.title}</div>
                    <div className="text-[11px] text-[var(--color-text-secondary)]">
                      {membership?.inclusion} · {story.status}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => void remove(story.id)}>
                    Remove
                  </Button>
                </div>
              )
            })}
          </div>

          <h3 className="mt-4 mb-2 text-[12px] font-semibold text-[var(--color-text-secondary)]">
            Candidates
          </h3>
          <div className="space-y-1">
            {candidates.slice(0, 8).map((story) => (
              <div key={story.id} className="flex items-center justify-between gap-2 text-[13px]">
                <span>
                  {story.key} · {story.title}
                </span>
                <Button size="sm" variant="secondary" onClick={() => void add(story.id)}>
                  Add must
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
