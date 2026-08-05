import { CreateStoryForm } from '@/features/create-story/ui/CreateStoryForm'
import { useWorkspaceStore } from '@/features/workspace/model/workspace-store'
import { Badge } from '@/shared/ui/badge'

export function BacklogPage() {
  const stories = useWorkspaceStore((s) => s.stories)

  return (
    <section className="flex h-full flex-col gap-4 p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight">Backlog</h1>
          <p className="text-[var(--color-text-secondary)]">
            Product Backlog — данные из Domain Model, не из колонок доски.
          </p>
        </div>
        <Badge tone="accent">{stories.length} stories</Badge>
      </header>

      <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
        <CreateStoryForm />

        <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]">
          <table className="w-full border-collapse text-left">
            <thead className="bg-[var(--color-bg-subtle)] text-[11px] tracking-wide text-[var(--color-text-tertiary)] uppercase">
              <tr>
                <th className="px-3 py-2 font-semibold">Key</th>
                <th className="px-3 py-2 font-semibold">Title</th>
                <th className="px-3 py-2 font-semibold">Type</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Works</th>
                <th className="px-3 py-2 font-semibold">Hours</th>
                <th className="px-3 py-2 font-semibold">Progress</th>
              </tr>
            </thead>
            <tbody>
              {stories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-[var(--color-text-tertiary)]">
                    Бэклог пуст — создайте первую User Story.
                  </td>
                </tr>
              ) : (
                stories.map((story) => (
                  <tr
                    key={story.id}
                    className="border-t border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-app)]"
                  >
                    <td className="px-3 py-2 font-mono text-[12px] text-[var(--color-text-tertiary)]">
                      {story.key}
                    </td>
                    <td className="px-3 py-2 font-medium">{story.title}</td>
                    <td className="px-3 py-2 text-[var(--color-text-secondary)]">{story.storyType}</td>
                    <td className="px-3 py-2">
                      <Badge>{story.status}</Badge>
                    </td>
                    <td className="px-3 py-2">{story.workItemCount}</td>
                    <td className="px-3 py-2">{story.remainingHours}h</td>
                    <td className="px-3 py-2">{story.progress}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
