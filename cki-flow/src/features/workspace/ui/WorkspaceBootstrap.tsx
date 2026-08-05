import { useEffect, type ReactNode } from 'react'
import { useWorkspaceStore } from '@/features/workspace/model/workspace-store'
import { Button } from '@/shared/ui/button'

type WorkspaceBootstrapProps = {
  children: ReactNode
}

export function WorkspaceBootstrap({ children }: WorkspaceBootstrapProps) {
  const ready = useWorkspaceStore((s) => s.ready)
  const loading = useWorkspaceStore((s) => s.loading)
  const error = useWorkspaceStore((s) => s.error)
  const bootstrap = useWorkspaceStore((s) => s.bootstrap)

  useEffect(() => {
    void bootstrap()
  }, [bootstrap])

  if (error && !ready) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-6">
          <h1 className="text-base font-semibold">Не удалось загрузить рабочее пространство</h1>
          <p className="mt-2 text-[var(--color-text-secondary)]">{error}</p>
          <Button className="mt-4" variant="primary" onClick={() => void bootstrap()}>
            Повторить
          </Button>
        </div>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="flex h-full items-center justify-center text-[var(--color-text-secondary)]">
        {loading ? 'Загрузка CKI Flow…' : 'Инициализация…'}
      </div>
    )
  }

  return children
}
