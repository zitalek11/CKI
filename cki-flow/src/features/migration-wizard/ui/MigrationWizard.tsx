import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useMigrationWizardStore } from '@/features/migration-wizard/model/wizard-store'
import { useWorkspaceStore } from '@/features/workspace/model/workspace-store'
import { StoryStatus, StoryType } from '@/domain/model/enums'
import { validateImportDraft } from '@/domain/migration/validate-draft'
import { summarizeDraft } from '@/domain/migration/summary'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/cn'

const STEPS = [
  { id: 'file', label: 'Файл' },
  { id: 'analyze', label: 'Анализ' },
  { id: 'review', label: 'Проверка' },
  { id: 'mapping', label: 'Сопоставление' },
  { id: 'preview', label: 'Предпросмотр' },
  { id: 'confirm', label: 'Подтверждение' },
  { id: 'journal', label: 'Журнал' },
] as const

export function MigrationWizard() {
  const step = useMigrationWizardStore((s) => s.step)
  const mode = useMigrationWizardStore((s) => s.mode)
  const setMode = useMigrationWizardStore((s) => s.setMode)
  const analyzing = useMigrationWizardStore((s) => s.analyzing)
  const applying = useMigrationWizardStore((s) => s.applying)
  const error = useMigrationWizardStore((s) => s.error)
  const fileName = useMigrationWizardStore((s) => s.fileName)
  const draft = useMigrationWizardStore((s) => s.draft)
  const summary = useMigrationWizardStore((s) => s.summary)
  const validation = useMigrationWizardStore((s) => s.validation)
  const ambiguous = useMigrationWizardStore((s) => s.ambiguous)
  const diffs = useMigrationWizardStore((s) => s.diffs)
  const selectedDiffKeys = useMigrationWizardStore((s) => s.selectedDiffKeys)
  const journal = useMigrationWizardStore((s) => s.journal)
  const analyzeFile = useMigrationWizardStore((s) => s.analyzeFile)
  const loadSample = useMigrationWizardStore((s) => s.loadSample)
  const updateStoryTitle = useMigrationWizardStore((s) => s.updateStoryTitle)
  const removeStory = useMigrationWizardStore((s) => s.removeStory)
  const resolveMapping = useMigrationWizardStore((s) => s.resolveMapping)
  const toggleDiff = useMigrationWizardStore((s) => s.toggleDiff)
  const selectAllDiffs = useMigrationWizardStore((s) => s.selectAllDiffs)
  const applyImport = useMigrationWizardStore((s) => s.applyImport)
  const back = useMigrationWizardStore((s) => s.back)
  const reset = useMigrationWizardStore((s) => s.reset)
  const setStep = useMigrationWizardStore((s) => s.setStep)
  const productId = useWorkspaceStore((s) => s.summary?.product.id)
  const refresh = useWorkspaceStore((s) => s.refresh)

  const stepIndex = STEPS.findIndex((item) => item.id === step)

  const liveValidation = useMemo(
    () => (draft ? validateImportDraft(draft) : validation),
    [draft, validation],
  )
  const liveSummary = useMemo(
    () => (draft ? summarizeDraft(draft) : summary),
    [draft, summary],
  )

  const goNextFromReview = () => {
    if (ambiguous.length > 0) setStep('mapping')
    else setStep('preview')
  }

  const goNextFromMapping = () => setStep('preview')

  const goNextFromPreview = () => setStep('confirm')

  const onConfirm = async () => {
    if (!productId) return
    await applyImport(productId)
    await refresh()
  }

  return (
    <section className="flex h-full flex-col gap-4 p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Migration Wizard</h1>
          <p className="text-[var(--color-text-secondary)]">
            Импорт существующего бэклога ЦКИ в готовую модель планирования.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => reset()}>
          Начать заново
        </Button>
      </header>

      <ol className="flex flex-wrap gap-2">
        {STEPS.map((item, index) => (
          <li key={item.id}>
            <Badge
              tone={
                index === stepIndex ? 'accent' : index < stepIndex ? 'success' : 'neutral'
              }
            >
              {index + 1}. {item.label}
            </Badge>
          </li>
        ))}
      </ol>

      {error && (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-danger)]/40 bg-[color-mix(in_oklab,var(--color-danger)_10%,transparent)] px-3 py-2 text-[13px] text-[var(--color-danger)]">
          {error}
        </div>
      )}

      {step === 'file' && (
        <div className="grid max-w-2xl gap-4">
          <section className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4">
            <h2 className="text-[13px] font-semibold">Режим импорта</h2>
            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                variant={mode === 'full' ? 'primary' : 'secondary'}
                onClick={() => setMode('full')}
              >
                Полная миграция
              </Button>
              <Button
                size="sm"
                variant={mode === 'update' ? 'primary' : 'secondary'}
                onClick={() => setMode('update')}
              >
                Обновление
              </Button>
            </div>
            <p className="mt-2 text-[12px] text-[var(--color-text-secondary)]">
              {mode === 'full'
                ? 'Создаёт структуру проекта заново (кварталы, спринты, backlog, зависимости). Workflow templates сохраняются.'
                : 'Сравнивает с текущим проектом и предлагает применить только выбранные изменения.'}
            </p>
          </section>

          <section className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-6">
            <h2 className="text-[13px] font-semibold">Шаг 1 · Выбор файла</h2>
            <p className="mt-1 text-[12px] text-[var(--color-text-secondary)]">
              Источники: PDF-доска ЦКИ или JSON (`cki-board-export`). Excel/CSV/Jira/Miro —
              через адаптеры позже.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <label className="inline-flex">
                <input
                  type="file"
                  accept=".json,.pdf,application/json,application/pdf"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) void analyzeFile(file)
                    event.target.value = ''
                  }}
                />
                <span className="inline-flex h-8 cursor-pointer items-center rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-3 text-[13px] font-medium text-white hover:brightness-105">
                  Выбрать файл
                </span>
              </label>
              <Button variant="secondary" onClick={() => void loadSample()}>
                Загрузить sample JSON
              </Button>
            </div>
          </section>
        </div>
      )}

      {step === 'analyze' && (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-6 text-[13px] text-[var(--color-text-secondary)]">
          {analyzing
            ? `Анализируем структуру «${fileName ?? 'файл'}»…`
            : 'Анализ завершён.'}
        </div>
      )}

      {step === 'review' && draft && liveSummary && (
        <div className="grid gap-4 xl:grid-cols-[280px_1fr]">
          <aside className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4">
            <h2 className="text-[13px] font-semibold">Найдено</h2>
            <ul className="mt-3 space-y-1.5 text-[13px] text-[var(--color-text-secondary)]">
              <li>{liveSummary.quarters} квартала</li>
              <li>{liveSummary.sprints} спринтов</li>
              <li>{liveSummary.stories} User Story</li>
              <li>{liveSummary.epics} Epic</li>
              <li>{liveSummary.initiatives} инициатив</li>
              <li>{liveSummary.people} участников</li>
              <li>{liveSummary.dependencies} зависимостей</li>
              <li>{liveSummary.releases} релизов</li>
              <li className="pt-1 text-[var(--color-warning)]">
                {liveSummary.needsReview} требуют проверки
              </li>
            </ul>
            {draft.rawNotes.length > 0 && (
              <div className="mt-4 space-y-1 text-[11px] text-[var(--color-text-tertiary)]">
                {draft.rawNotes.map((note) => (
                  <p key={note}>{note}</p>
                ))}
              </div>
            )}
          </aside>

          <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4">
            <h2 className="mb-3 text-[13px] font-semibold">User Story · исправление</h2>
            <div className="max-h-[50vh] space-y-2 overflow-auto">
              {draft.stories.map((story) => (
                <div
                  key={story.tempId}
                  className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border-subtle)] pb-2"
                >
                  <span className="w-20 shrink-0 text-[11px] text-[var(--color-text-tertiary)]">
                    {story.key ?? '—'}
                  </span>
                  <input
                    value={story.title}
                    onChange={(event) => updateStoryTitle(story.tempId, event.target.value)}
                    className="min-w-[220px] flex-1 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-transparent px-2 py-1 text-[13px] outline-none"
                  />
                  {story.needsReview && <Badge tone="warning">review</Badge>}
                  <Button size="sm" variant="ghost" onClick={() => removeStory(story.tempId)}>
                    Удалить
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="ghost" onClick={() => back()}>
                Назад
              </Button>
              <Button variant="primary" onClick={goNextFromReview}>
                Далее
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === 'mapping' && (
        <div className="max-w-3xl rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4">
          <h2 className="text-[13px] font-semibold">Шаг 5 · Сопоставление</h2>
          <p className="mt-1 text-[12px] text-[var(--color-text-secondary)]">
            Правила сохраняются и применяются при следующих импортах (например, «БА» → BA).
          </p>
          {ambiguous.length === 0 ? (
            <p className="mt-4 text-[13px] text-[var(--color-success)]">
              Неоднозначностей не осталось.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {ambiguous.map((token) => (
                <div
                  key={`${token.field}:${token.token}`}
                  className="flex flex-wrap items-end gap-2 border-b border-[var(--color-border-subtle)] pb-3"
                >
                  <div className="min-w-[160px]">
                    <div className="text-[11px] uppercase text-[var(--color-text-tertiary)]">
                      {token.field}
                    </div>
                    <div className="font-medium">{token.token}</div>
                    <div className="text-[12px] text-[var(--color-text-secondary)]">
                      {token.hint}
                    </div>
                  </div>
                  {token.field === 'status' ? (
                    <select
                      className="h-8 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-transparent px-2 text-[13px]"
                      defaultValue=""
                      onChange={(event) => {
                        if (event.target.value) resolveMapping(token, event.target.value)
                      }}
                    >
                      <option value="" disabled>
                        Выберите статус
                      </option>
                      {Object.values(StoryStatus).map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  ) : token.field === 'work_type' ? (
                    <select
                      className="h-8 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-transparent px-2 text-[13px]"
                      defaultValue=""
                      onChange={(event) => {
                        if (event.target.value) resolveMapping(token, event.target.value)
                      }}
                    >
                      <option value="" disabled>
                        Тип
                      </option>
                      {Object.values(StoryType).map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  ) : token.field === 'role' ? (
                    <select
                      className="h-8 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-transparent px-2 text-[13px]"
                      defaultValue=""
                      onChange={(event) => {
                        if (event.target.value) resolveMapping(token, event.target.value)
                      }}
                    >
                      <option value="" disabled>
                        Роль
                      </option>
                      {['BA', 'SA', 'BE', 'FE', 'QA', 'PM', 'DevOps', 'Designer'].map(
                        (value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ),
                      )}
                    </select>
                  ) : (
                    <input
                      placeholder="Значение"
                      className="h-8 min-w-[180px] rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-transparent px-2 text-[13px]"
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          const value = (event.target as HTMLInputElement).value.trim()
                          if (value) resolveMapping(token, value)
                        }
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 flex gap-2">
            <Button variant="ghost" onClick={() => setStep('review')}>
              Назад
            </Button>
            <Button variant="primary" onClick={goNextFromMapping}>
              Далее
            </Button>
          </div>
        </div>
      )}

      {step === 'preview' && draft && liveSummary && (
        <div className="grid gap-4">
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4">
            <h2 className="text-[13px] font-semibold">Шаг 6 · Предпросмотр результата</h2>
            <p className="mt-1 text-[12px] text-[var(--color-text-secondary)]">
              После импорта экраны заполнятся на основе этих данных.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                ['Roadmap', `${liveSummary.initiatives} инициатив · ${liveSummary.epics} epic`],
                ['Sprint Planning', `${liveSummary.sprints} спринтов`],
                ['Backlog', `${liveSummary.stories} User Story`],
                ['Capacity', `${liveSummary.people} участников`],
                ['Timeline', `${liveSummary.quarters} квартала`],
                ['Release', `${liveSummary.releases} релизов`],
              ].map(([title, detail]) => (
                <article
                  key={title}
                  className="rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] p-3"
                >
                  <div className="font-medium">{title}</div>
                  <div className="text-[12px] text-[var(--color-text-secondary)]">{detail}</div>
                </article>
              ))}
            </div>
          </div>

          {mode === 'update' && (
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-[13px] font-semibold">Различия с текущим проектом</h2>
                <Button size="sm" variant="ghost" onClick={() => selectAllDiffs()}>
                  Выбрать все
                </Button>
              </div>
              {diffs.length === 0 ? (
                <p className="mt-2 text-[13px] text-[var(--color-text-secondary)]">
                  Изменений не найдено.
                </p>
              ) : (
                <div className="mt-3 max-h-[40vh] space-y-1 overflow-auto">
                  {diffs.map((item) => {
                    const key = `${item.entityType}:${item.key}:${item.field}`
                    return (
                      <label
                        key={key}
                        className="flex cursor-pointer items-start gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 hover:bg-[var(--color-bg-subtle)]"
                      >
                        <input
                          type="checkbox"
                          checked={selectedDiffKeys.includes(key)}
                          onChange={() => toggleDiff(key)}
                        />
                        <span className="text-[13px]">
                          <span className="text-[var(--color-text-tertiary)]">
                            {item.entityType}
                          </span>{' '}
                          <strong>{item.key}</strong> · {item.field}: {item.before} → {item.after}
                        </span>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {liveValidation && (
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4">
              <h2 className="text-[13px] font-semibold">Проверка корректности</h2>
              <p className="mt-1 text-[12px]">
                Статус:{' '}
                <Badge tone={liveValidation.ok ? 'success' : 'danger'}>
                  {liveValidation.ok ? 'можно импортировать' : 'есть ошибки'}
                </Badge>
              </p>
              <ul className="mt-3 max-h-48 space-y-1 overflow-auto text-[12px]">
                {liveValidation.issues.map((issue) => (
                  <li
                    key={`${issue.code}:${issue.message}`}
                    className={cn(
                      issue.severity === 'error' && 'text-[var(--color-danger)]',
                      issue.severity === 'warning' && 'text-[var(--color-warning)]',
                      issue.severity === 'info' && 'text-[var(--color-text-secondary)]',
                    )}
                  >
                    [{issue.severity}] {issue.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setStep(ambiguous.length ? 'mapping' : 'review')}>
              Назад
            </Button>
            <Button
              variant="primary"
              disabled={!!liveValidation && !liveValidation.ok}
              onClick={goNextFromPreview}
            >
              Далее к подтверждению
            </Button>
          </div>
        </div>
      )}

      {step === 'confirm' && (
        <div className="max-w-xl rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4">
          <h2 className="text-[13px] font-semibold">Шаг 7 · Подтверждение</h2>
          <p className="mt-2 text-[13px] text-[var(--color-text-secondary)]">
            Режим: <strong>{mode === 'full' ? 'полная миграция' : 'обновление'}</strong>
            <br />
            Файл: {fileName}
            <br />
            Будет создано / обновлено объектов по модели предпросмотра. Отменить массово можно
            через Reset demo data в Settings.
          </p>
          <div className="mt-4 flex gap-2">
            <Button variant="ghost" onClick={() => setStep('preview')}>
              Назад
            </Button>
            <Button
              variant="primary"
              disabled={applying || !productId}
              onClick={() => void onConfirm()}
            >
              {applying ? 'Импорт…' : 'Подтвердить импорт'}
            </Button>
          </div>
        </div>
      )}

      {step === 'journal' && journal && (
        <div className="max-w-xl rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4">
          <h2 className="text-[13px] font-semibold">Журнал импорта</h2>
          <p className="mt-1 text-[12px] text-[var(--color-text-secondary)]">
            Завершено: {new Date(journal.completedAt).toLocaleString()}
          </p>
          <ul className="mt-3 space-y-1 text-[13px]">
            <li>инициатив — {journal.imported.initiatives}</li>
            <li>Epic — {journal.imported.epics}</li>
            <li>User Story — {journal.imported.stories}</li>
            <li>задач (WorkItem) — {journal.imported.workItems}</li>
            <li>сотрудников — {journal.imported.employees}</li>
            <li>зависимостей — {journal.imported.dependencies}</li>
            <li>спринтов — {journal.imported.sprints}</li>
            <li>кварталов — {journal.imported.quarters}</li>
            <li>релизов — {journal.imported.releases}</li>
          </ul>
          {journal.warnings.length > 0 && (
            <div className="mt-4">
              <h3 className="text-[12px] font-semibold text-[var(--color-warning)]">
                Предупреждения
              </h3>
              <ul className="mt-1 space-y-1 text-[12px] text-[var(--color-warning)]">
                {journal.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => reset()}>
              Новый импорт
            </Button>
            <Link
              to="/deliver/backlog"
              className="inline-flex h-8 items-center rounded-[var(--radius-sm)] bg-[var(--color-bg-subtle)] px-3 text-[13px] font-medium"
            >
              Открыть Backlog
            </Link>
            <Link
              to="/plan/quarter"
              className="inline-flex h-8 items-center rounded-[var(--radius-sm)] bg-[var(--color-bg-subtle)] px-3 text-[13px] font-medium"
            >
              Открыть Quarter
            </Link>
          </div>
        </div>
      )}

    </section>
  )
}
