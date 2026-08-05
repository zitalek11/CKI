import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { appServices } from '@/application/composition'
import { useThemeStore } from '@/features/theme/model/theme-store'
import { useWorkspaceStore } from '@/features/workspace/model/workspace-store'
import { Button } from '@/shared/ui/button'

export function SettingsPage() {
  const mode = useThemeStore((s) => s.mode)
  const setMode = useThemeStore((s) => s.setMode)
  const resetDemoData = useWorkspaceStore((s) => s.resetDemoData)
  const refresh = useWorkspaceStore((s) => s.refresh)
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onExport = async () => {
    setError(null)
    const envelope = await appServices.io.exportJson()
    const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `cki-flow-export-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setMessage('Export downloaded')
  }

  const onImportFile = async (file: File) => {
    setError(null)
    setMessage(null)
    try {
      const text = await file.text()
      await appServices.io.importJson(text)
      await refresh()
      setMessage(`Imported ${file.name}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    }
  }

  return (
    <section className="flex h-full flex-col gap-4 p-6">
      <header>
        <h1 className="text-lg font-semibold">Settings</h1>
        <p className="text-[var(--color-text-secondary)]">Тема, demo data, import/export.</p>
      </header>

      <div className="grid max-w-2xl gap-4">
        <section className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4">
          <h2 className="text-[13px] font-semibold">Desktop build</h2>
          <p className="mt-1 text-[12px] text-[var(--color-text-secondary)]">
            macOS <code className="text-[11px]">.dmg</code>: локально{' '}
            <code className="text-[11px]">npm run build:dmg</code>, либо GitHub Actions → «CKI Flow —
            macOS DMG». Подробности в <code className="text-[11px]">cki-flow/BUILD.md</code>.
          </p>
        </section>

        <section className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4">
          <h2 className="text-[13px] font-semibold">Theme</h2>
          <div className="mt-2 flex gap-2">
            {(['light', 'dark', 'system'] as const).map((value) => (
              <Button
                key={value}
                size="sm"
                variant={mode === value ? 'primary' : 'secondary'}
                onClick={() => setMode(value)}
              >
                {value}
              </Button>
            ))}
          </div>
        </section>

        <section className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4">
          <h2 className="text-[13px] font-semibold">Migration</h2>
          <p className="mt-1 text-[12px] text-[var(--color-text-secondary)]">
            Перенос существующей доски ЦКИ (PDF / JSON) через пошаговый мастер.
          </p>
          <div className="mt-2">
            <Link
              to="/system/migration"
              className="inline-flex h-8 items-center rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-3 text-[13px] font-medium text-white hover:brightness-105"
            >
              Open Migration Wizard
            </Link>
          </div>
        </section>

        <section className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4">
          <h2 className="text-[13px] font-semibold">Data</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => void onExport()}>
              Export JSON
            </Button>
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>
              Import JSON
            </Button>
            <Button variant="ghost" onClick={() => void resetDemoData()}>
              Reset demo data
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void onImportFile(file)
                event.target.value = ''
              }}
            />
          </div>
          {message && <p className="mt-2 text-[12px] text-[var(--color-success)]">{message}</p>}
          {error && <p className="mt-2 text-[12px] text-[var(--color-danger)]">{error}</p>}
        </section>
      </div>
    </section>
  )
}
