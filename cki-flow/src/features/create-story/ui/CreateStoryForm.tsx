import { useState, type FormEvent } from 'react'
import { StoryType } from '@/domain/model/enums'
import { useWorkspaceStore } from '@/features/workspace/model/workspace-store'
import { Button } from '@/shared/ui/button'

const STORY_TYPES: Array<{ value: StoryType; label: string }> = [
  { value: StoryType.Feature, label: 'Функция / API' },
  { value: StoryType.Documentation, label: 'Документация' },
  { value: StoryType.Integration, label: 'Интеграция' },
  { value: StoryType.Spike, label: 'Исследование' },
  { value: StoryType.Infrastructure, label: 'Инфраструктура' },
]

type CreateStoryFormProps = {
  compact?: boolean
}

export function CreateStoryForm({ compact = false }: CreateStoryFormProps) {
  const createStory = useWorkspaceStore((s) => s.createStory)
  const loading = useWorkspaceStore((s) => s.loading)
  const [title, setTitle] = useState('')
  const [storyType, setStoryType] = useState<StoryType>(StoryType.Feature)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setMessage(null)
    setError(null)
    try {
      await createStory({ title, storyType })
      setTitle('')
      setMessage('User Story создана, работы и зависимости сгенерированы из шаблона.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось создать Story')
    }
  }

  return (
    <form
      onSubmit={(event) => void onSubmit(event)}
      className={
        compact
          ? 'flex flex-col gap-2'
          : 'rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4'
      }
    >
      {!compact && <h2 className="text-[13px] font-semibold">Новая User Story</h2>}
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Название User Story"
        className="h-8 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-app)] px-2.5 outline-none focus:border-[var(--color-accent)]"
        required
      />
      <select
        value={storyType}
        onChange={(event) => setStoryType(event.target.value as StoryType)}
        className="h-8 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-app)] px-2.5 outline-none"
      >
        {STORY_TYPES.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
      <Button type="submit" variant="primary" disabled={loading || title.trim().length === 0}>
        Создать + сгенерировать работы
      </Button>
      {message && <p className="text-[12px] text-[var(--color-success)]">{message}</p>}
      {error && <p className="text-[12px] text-[var(--color-danger)]">{error}</p>}
    </form>
  )
}
