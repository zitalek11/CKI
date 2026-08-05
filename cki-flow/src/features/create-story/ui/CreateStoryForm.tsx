import { useEffect, useState, type FormEvent } from 'react'
import { appServices } from '@/application/composition'
import type { Sprint } from '@/domain/model/entities'
import { StoryType } from '@/domain/model/enums'
import { useWorkspaceStore } from '@/features/workspace/model/workspace-store'
import { labelStoryPriority } from '@/shared/lib/labels'
import { Button } from '@/shared/ui/button'

const STORY_TYPES: Array<{ value: StoryType; label: string }> = [
  { value: StoryType.Feature, label: 'Функция / API' },
  { value: StoryType.Documentation, label: 'Документация' },
  { value: StoryType.Integration, label: 'Интеграция' },
  { value: StoryType.Spike, label: 'Исследование' },
  { value: StoryType.Infrastructure, label: 'Инфраструктура' },
]

const PRIORITIES = ['critical', 'high', 'medium', 'low'] as const

const inputClass =
  'h-8 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-app)] px-2.5 outline-none focus:border-[var(--color-accent)]'
const labelClass = 'text-[11px] font-medium text-[var(--color-text-tertiary)]'

type CreateStoryFormProps = {
  compact?: boolean
}

type Option = { id: string; label: string }

export function CreateStoryForm({ compact = false }: CreateStoryFormProps) {
  const summary = useWorkspaceStore((s) => s.summary)
  const templates = useWorkspaceStore((s) => s.templates)
  const estimationTemplates = useWorkspaceStore((s) => s.estimationTemplates)
  const createStory = useWorkspaceStore((s) => s.createStory)
  const loading = useWorkspaceStore((s) => s.loading)

  const [expanded, setExpanded] = useState(!compact)
  const [title, setTitle] = useState('')
  const [storyType, setStoryType] = useState<StoryType>(StoryType.Feature)
  const [asA, setAsA] = useState('')
  const [iWant, setIWant] = useState('')
  const [soThat, setSoThat] = useState('')
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>('medium')
  const [workflowTemplateId, setWorkflowTemplateId] = useState('')
  const [estimationTemplateId, setEstimationTemplateId] = useState('')
  const [sprintId, setSprintId] = useState('')
  const [epicId, setEpicId] = useState('')
  const [initiativeId, setInitiativeId] = useState('')
  const [releaseId, setReleaseId] = useState('')

  const [sprints, setSprints] = useState<Sprint[]>([])
  const [epics, setEpics] = useState<Option[]>([])
  const [initiatives, setInitiatives] = useState<Option[]>([])
  const [releases, setReleases] = useState<Option[]>([])

  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!summary) return
    const productId = summary.product.id
    void appServices.sprints.listAll(productId).then(setSprints)
    void appServices.uow.read().then((db) => {
      setEpics(
        db.epics
          .filter((item) => item.productId === productId)
          .map((item) => ({ id: item.id, label: `${item.key} · ${item.title}` })),
      )
      setInitiatives(
        db.initiatives
          .filter((item) => item.productId === productId)
          .map((item) => ({ id: item.id, label: `${item.key} · ${item.title}` })),
      )
    })
    void appServices.releases.list(productId).then((items) =>
      setReleases(items.map((item) => ({ id: item.id, label: `${item.key} · ${item.name}` }))),
    )
  }, [summary])

  useEffect(() => {
    setEpicId(summary?.epic?.id ?? '')
    setInitiativeId(summary?.initiative?.id ?? '')
  }, [summary?.epic?.id, summary?.initiative?.id])

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setMessage(null)
    setError(null)
    try {
      await createStory({
        title,
        storyType,
        asA: asA.trim() || undefined,
        iWant: iWant.trim() || undefined,
        soThat: soThat.trim() || undefined,
        priority,
        workflowTemplateId: workflowTemplateId || undefined,
        estimationTemplateId: estimationTemplateId || undefined,
        targetSprintId: sprintId || undefined,
        epicId: epicId || undefined,
        initiativeId: initiativeId || undefined,
        targetReleaseId: releaseId || undefined,
      })
      setTitle('')
      setAsA('')
      setIWant('')
      setSoThat('')
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
        className={inputClass}
        required
      />

      <div className="grid grid-cols-2 gap-2">
        <select
          value={storyType}
          onChange={(event) => setStoryType(event.target.value as StoryType)}
          className={inputClass}
        >
          {STORY_TYPES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <select
          value={priority}
          onChange={(event) => setPriority(event.target.value as typeof priority)}
          className={inputClass}
        >
          {PRIORITIES.map((value) => (
            <option key={value} value={value}>
              {labelStoryPriority(value)}
            </option>
          ))}
        </select>
      </div>

      {compact && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="self-start text-[11px] text-[var(--color-accent)] hover:underline"
        >
          Показать доп. поля (карточка, шаблон, план)
        </button>
      )}

      {expanded && (
        <>
          <div className="flex flex-col gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] p-2">
            <span className={labelClass}>Карточка (as a / I want / so that)</span>
            <input
              value={asA}
              onChange={(event) => setAsA(event.target.value)}
              placeholder="Как <роль>"
              className={inputClass}
            />
            <input
              value={iWant}
              onChange={(event) => setIWant(event.target.value)}
              placeholder="Я хочу <действие>"
              className={inputClass}
            />
            <input
              value={soThat}
              onChange={(event) => setSoThat(event.target.value)}
              placeholder="Чтобы <ценность>"
              className={inputClass}
            />
          </div>

          <label className="flex flex-col gap-1">
            <span className={labelClass}>Шаблон процесса</span>
            <select
              value={workflowTemplateId}
              onChange={(event) => setWorkflowTemplateId(event.target.value)}
              className={inputClass}
            >
              <option value="">Автоматически по типу</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className={labelClass}>Шаблон оценки</span>
            <select
              value={estimationTemplateId}
              onChange={(event) => setEstimationTemplateId(event.target.value)}
              className={inputClass}
            >
              <option value="">По умолчанию продукта</option>
              {estimationTemplates.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Спринт</span>
              <select
                value={sprintId}
                onChange={(event) => setSprintId(event.target.value)}
                className={inputClass}
              >
                <option value="">Бэклог</option>
                {sprints.map((sprint) => (
                  <option key={sprint.id} value={sprint.id}>
                    {sprint.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Релиз</span>
              <select
                value={releaseId}
                onChange={(event) => setReleaseId(event.target.value)}
                className={inputClass}
              >
                <option value="">Без релиза</option>
                {releases.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Epic</span>
              <select
                value={epicId}
                onChange={(event) => setEpicId(event.target.value)}
                className={inputClass}
              >
                <option value="">Без Epic</option>
                {epics.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Инициатива</span>
              <select
                value={initiativeId}
                onChange={(event) => setInitiativeId(event.target.value)}
                className={inputClass}
              >
                <option value="">Без инициативы</option>
                {initiatives.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </>
      )}

      <Button type="submit" variant="primary" disabled={loading || title.trim().length === 0}>
        Создать + сгенерировать работы
      </Button>
      {message && <p className="text-[12px] text-[var(--color-success)]">{message}</p>}
      {error && <p className="text-[12px] text-[var(--color-danger)]">{error}</p>}
    </form>
  )
}
