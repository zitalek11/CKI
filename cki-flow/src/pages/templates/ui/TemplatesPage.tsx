import { useWorkspaceStore } from '@/features/workspace/model/workspace-store'
import { Badge } from '@/shared/ui/badge'

export function TemplatesPage() {
  const templates = useWorkspaceStore((s) => s.templates)

  return (
    <section className="flex h-full flex-col gap-4 p-6">
      <header className="space-y-1">
        <h1 className="text-lg font-semibold tracking-tight">Workflow Templates</h1>
        <p className="text-[var(--color-text-secondary)]">
          Конфигурируемые процессы. При создании Story выбранный шаблон генерирует WorkItems и
          зависимости.
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        {templates.map((template) => (
          <article
            key={template.id}
            className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-mono text-[11px] text-[var(--color-text-tertiary)]">
                  {template.code}
                </div>
                <h2 className="text-[15px] font-semibold">{template.name}</h2>
              </div>
              <Badge tone="success">{template.status}</Badge>
            </div>
            <p className="mt-2 text-[12px] text-[var(--color-text-secondary)]">
              {template.description ?? 'Published workflow template'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-[12px] text-[var(--color-text-secondary)]">
              <span>v{template.versionNumber ?? '—'}</span>
              <span>·</span>
              <span>{template.stageCount} stages</span>
              <span>·</span>
              <span>{template.dependencyRuleCount} deps</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {template.applicableStoryTypes.map((type) => (
                <Badge key={type} tone="accent">
                  {type}
                </Badge>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
