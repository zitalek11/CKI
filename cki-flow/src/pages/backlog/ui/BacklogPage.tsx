import { CreateStoryForm } from '@/features/create-story/ui/CreateStoryForm'
import { useStoryPeekStore } from '@/features/story-peek/model/peek-store'
import { useWorkspaceStore } from '@/features/workspace/model/workspace-store'
import { labelStoryStatus, labelStoryType } from '@/shared/lib/labels'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'

export function BacklogPage() {
  const stories = useWorkspaceStore((s) => s.stories)
  const openPeek = useStoryPeekStore((s) => s.open)

  return (
    <section className="flex h-full flex-col gap-4 p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight">Бэклог</h1>
          <p className="text-[var(--color-text-secondary)]">
            Product Backlog — данные из доменной модели, не из колонок доски.
          </p>
        </div>
        <Badge tone="accent">{stories.length} User Story</Badge>
      </header>

      <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
        <CreateStoryForm />

        <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]">
          <table className="w-full border-collapse text-left">
            <thead className="bg-[var(--color-bg-subtle)] text-[11px] tracking-wide text-[var(--color-text-tertiary)] uppercase">
              <tr>
                <th className="px-3 py-2 font-semibold">Ключ</th>
                <th className="px-3 py-2 font-semibold">Название</th>
                <th className="px-3 py-2 font-semibold">Тип</th>
                <th className="px-3 py-2 font-semibold">Статус</th>
                <th className="px-3 py-2 font-semibold">Задачи</th>
                <th className="px-3 py-2 font-semibold">Часы</th>
                <th className="px-3 py-2 font-semibold">Прогресс</th>
                <th className="px-3 py-2 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {stories.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-3 py-8 text-center text-[var(--color-text-tertiary)]"
                  >
                    Бэклог пуст — создайте первую User Story.
                  </td>
                </tr>
              ) : (
                stories.map((story) => (
                  <tr
                    key={story.id}
                    className="cursor-pointer border-t border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-app)]"
                    onDoubleClick={() => openPeek(story.id)}
                  >
                    <td className="px-3 py-2 font-mono text-[12px] text-[var(--color-text-tertiary)]">
                      {story.key}
                    </td>
                    <td className="px-3 py-2 font-medium">{story.title}</td>
                    <td className="px-3 py-2 text-[var(--color-text-secondary)]">
                      {labelStoryType(story.storyType)}
                    </td>
                    <td className="px-3 py-2">
                      <Badge>{labelStoryStatus(story.status)}</Badge>
                    </td>
                    <td className="px-3 py-2">{story.workItemCount}</td>
                    <td className="px-3 py-2">{story.remainingHours} ч</td>
                    <td className="px-3 py-2">{story.progress}%</td>
                    <td className="px-3 py-2 text-right">
                      <Button size="sm" variant="ghost" onClick={() => openPeek(story.id)}>
                        Открыть
                      </Button>
                    </td>
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
