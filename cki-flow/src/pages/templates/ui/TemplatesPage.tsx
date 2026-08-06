import { useCallback, useEffect, useState } from 'react'
import { appServices } from '@/application/composition'
import type { WorkflowStage, WorkflowTemplateVersion } from '@/domain/model/entities'
import { useWorkspaceStore } from '@/features/workspace/model/workspace-store'
import { labelOrRaw, labelStoryType } from '@/shared/lib/labels'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/cn'

const TEMPLATE_STATUS: Record<string, string> = {
  draft: 'Черновик',
  review: 'На ревью',
  published: 'Опубликован',
  deprecated: 'Устарел',
  archived: 'В архиве',
}

const inputClass =
  'rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-app)] px-2 py-1 text-[12px] outline-none focus:border-[var(--color-accent)]'

type StageDraft = {
  descriptionTemplate: string
  goalTemplate: string
  expectedResultTemplate: string
  defaultEstimateHours: string
}

function toDraft(stage: WorkflowStage): StageDraft {
  return {
    descriptionTemplate: stage.descriptionTemplate ?? '',
    goalTemplate: stage.goalTemplate ?? '',
    expectedResultTemplate: stage.expectedResultTemplate ?? '',
    defaultEstimateHours: String(stage.defaultEstimateHours),
  }
}

export function TemplatesPage() {
  const summary = useWorkspaceStore((s) => s.summary)
  const templates = useWorkspaceStore((s) => s.templates)
  const estimationTemplates = useWorkspaceStore((s) => s.estimationTemplates)
  const refreshWorkspace = useWorkspaceStore((s) => s.refresh)

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [version, setVersion] = useState<WorkflowTemplateVersion | null>(null)
  const [drafts, setDrafts] = useState<Record<string, StageDraft>>({})
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busyStageKey, setBusyStageKey] = useState<string | null>(null)

  const loadVersion = useCallback(async (templateId: string) => {
    const item = await appServices.catalog.getTemplateVersion(templateId)
    setVersion(item ?? null)
    if (item) {
      setDrafts(Object.fromEntries(item.stages.map((stage) => [stage.key, toDraft(stage)])))
    }
  }, [])

  useEffect(() => {
    if (!selectedTemplateId) {
      setVersion(null)
      return
    }
    void loadVersion(selectedTemplateId)
  }, [selectedTemplateId, loadVersion])

  const saveStage = async (stage: WorkflowStage) => {
    if (!version) return
    const draft = drafts[stage.key]
    if (!draft) return
    setBusyStageKey(stage.key)
    setError(null)
    setMessage(null)
    try {
      await appServices.catalog.updateStageTemplate({
        workflowTemplateVersionId: version.id,
        stageKey: stage.key,
        descriptionTemplate: draft.descriptionTemplate,
        goalTemplate: draft.goalTemplate,
        expectedResultTemplate: draft.expectedResultTemplate,
        defaultEstimateHours: Number(draft.defaultEstimateHours) || 0,
      })
      await loadVersion(version.workflowTemplateId)
      setMessage(`Этап «${stage.name}» обновлён`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить этап')
    } finally {
      setBusyStageKey(null)
    }
  }

  const saveEstimationLine = async (templateId: string, lineId: string, hours: number) => {
    setError(null)
    try {
      await appServices.catalog.updateEstimationLine({
        estimationTemplateId: templateId,
        lineId,
        estimateHours: hours,
      })
      await refreshWorkspace()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить оценку')
    }
  }

  return (
    <section className="flex h-full flex-col gap-4 p-6">
      <header className="space-y-1">
        <h1 className="text-lg font-semibold tracking-tight">Шаблоны процессов</h1>
        <p className="text-[var(--color-text-secondary)]">
          Конфигурируемые процессы. При создании User Story выбранный шаблон генерирует задачи и
          зависимости. Нажмите на карточку, чтобы редактировать описания этапов и оценку часов.
        </p>
      </header>

      {error && <div className="text-[12px] text-[var(--color-danger)]">{error}</div>}
      {message && <div className="text-[12px] text-[var(--color-success)]">{message}</div>}

      <div className="grid gap-3 md:grid-cols-2">
        {templates.map((template) => (
          <article
            key={template.id}
            onClick={() => setSelectedTemplateId(template.id === selectedTemplateId ? null : template.id)}
            className={cn(
              'cursor-pointer rounded-[var(--radius-md)] border bg-[var(--color-bg-surface)] p-4 transition-colors',
              template.id === selectedTemplateId
                ? 'border-[var(--color-accent)]'
                : 'border-[var(--color-border-subtle)] hover:border-[var(--color-accent)]/50',
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-mono text-[11px] text-[var(--color-text-tertiary)]">
                  {template.code}
                </div>
                <h2 className="text-[15px] font-semibold">{template.name}</h2>
              </div>
              <Badge tone="success">
                {TEMPLATE_STATUS[template.status] ?? labelOrRaw(template.status)}
              </Badge>
            </div>
            <p className="mt-2 text-[12px] text-[var(--color-text-secondary)]">
              {template.description ?? 'Опубликованный шаблон процесса'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-[12px] text-[var(--color-text-secondary)]">
              <span>v{template.versionNumber ?? '—'}</span>
              <span>·</span>
              <span>{template.stageCount} этапов</span>
              <span>·</span>
              <span>{template.dependencyRuleCount} зависимостей</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {template.applicableStoryTypes.map((type) => (
                <Badge key={type} tone="accent">
                  {labelStoryType(type)}
                </Badge>
              ))}
            </div>
          </article>
        ))}
      </div>

      {version && (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4">
          <h2 className="mb-3 text-[13px] font-semibold">
            Этапы шаблона (версия {version.versionNumber})
          </h2>
          <div className="space-y-3">
            {version.stages
              .slice()
              .sort((a, b) => a.sortHint - b.sortHint)
              .map((stage) => {
                const draft = drafts[stage.key] ?? toDraft(stage)
                return (
                  <div
                    key={stage.id}
                    className="rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-app)] p-3"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="font-medium">
                        {stage.name} <span className="font-mono text-[11px] text-[var(--color-text-tertiary)]">({stage.key})</span>
                      </div>
                      <label className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-tertiary)]">
                        Оценка (ч)
                        <input
                          type="number"
                          min={0}
                          value={draft.defaultEstimateHours}
                          onChange={(event) =>
                            setDrafts({
                              ...drafts,
                              [stage.key]: { ...draft, defaultEstimateHours: event.target.value },
                            })
                          }
                          className={cn(inputClass, 'w-16')}
                        />
                      </label>
                    </div>
                    <div className="grid gap-2 md:grid-cols-3">
                      <label className="flex flex-col gap-1">
                        <span className="text-[11px] text-[var(--color-text-tertiary)]">Описание</span>
                        <textarea
                          value={draft.descriptionTemplate}
                          onChange={(event) =>
                            setDrafts({
                              ...drafts,
                              [stage.key]: { ...draft, descriptionTemplate: event.target.value },
                            })
                          }
                          className={cn(inputClass, 'min-h-[80px]')}
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-[11px] text-[var(--color-text-tertiary)]">Цель</span>
                        <textarea
                          value={draft.goalTemplate}
                          onChange={(event) =>
                            setDrafts({
                              ...drafts,
                              [stage.key]: { ...draft, goalTemplate: event.target.value },
                            })
                          }
                          className={cn(inputClass, 'min-h-[80px]')}
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-[11px] text-[var(--color-text-tertiary)]">Ожидаемый результат</span>
                        <textarea
                          value={draft.expectedResultTemplate}
                          onChange={(event) =>
                            setDrafts({
                              ...drafts,
                              [stage.key]: { ...draft, expectedResultTemplate: event.target.value },
                            })
                          }
                          className={cn(inputClass, 'min-h-[80px]')}
                        />
                      </label>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busyStageKey === stage.key}
                        onClick={() => void saveStage(stage)}
                      >
                        Сохранить этап
                      </Button>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[13px] font-semibold">Шаблоны оценки</h2>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              const code = prompt('Код шаблона', 'CUSTOM')
              const name = prompt('Название шаблона')
              if (!code || !name || !summary) return
              void appServices.catalog
                .createEstimationTemplate({
                  productId: summary.product.id,
                  code,
                  name,
                })
                .then(() => refreshWorkspace())
                .catch((err: Error) => setError(err.message))
            }}
          >
            Создать
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {estimationTemplates.map((template) => (
            <div
              key={template.id}
              className="rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-app)] p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium">
                  {template.name}{' '}
                  <span className="font-mono text-[11px] text-[var(--color-text-tertiary)]">
                    {template.code}
                  </span>
                </div>
                {template.isDefault && <Badge tone="accent">По умолчанию</Badge>}
              </div>
              <ul className="mt-2 space-y-1">
                {template.lines.map((line) => (
                  <li key={line.id} className="flex items-center justify-between gap-2 text-[12px]">
                    <span>
                      {line.stageName}{' '}
                      <span className="text-[var(--color-text-tertiary)]">({line.roleSkillCode})</span>
                    </span>
                    <input
                      type="number"
                      min={0}
                      defaultValue={line.estimateHours}
                      onBlur={(event) => {
                        const hours = Number(event.target.value)
                        if (!Number.isNaN(hours) && hours !== line.estimateHours) {
                          void saveEstimationLine(template.id, line.id, hours)
                        }
                      }}
                      className={cn(inputClass, 'w-16')}
                    />
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex flex-wrap gap-1">
                {!template.isDefault && summary && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      void appServices.catalog
                        .setDefaultEstimationTemplate({
                          productId: summary.product.id,
                          templateId: template.id,
                        })
                        .then(() => refreshWorkspace())
                        .catch((err: Error) => setError(err.message))
                    }
                  >
                    По умолчанию
                  </Button>
                )}
                {summary && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const code = prompt('Код копии', `${template.code}-COPY`)
                      if (!code) return
                      void appServices.catalog
                        .copyEstimationTemplate({
                          productId: summary.product.id,
                          sourceId: template.id,
                          code,
                          name: `${template.name} (копия)`,
                        })
                        .then(() => refreshWorkspace())
                        .catch((err: Error) => setError(err.message))
                    }}
                  >
                    Копировать
                  </Button>
                )}
                {summary && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (!confirm(`Удалить шаблон «${template.name}»?`)) return
                      void appServices.catalog
                        .deleteEstimationTemplate({
                          productId: summary.product.id,
                          templateId: template.id,
                        })
                        .then(() => refreshWorkspace())
                        .catch((err: Error) => setError(err.message))
                    }}
                  >
                    Удалить
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
