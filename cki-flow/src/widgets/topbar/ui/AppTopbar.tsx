import { Bell, Command, Moon, PanelLeft, Search, Sun } from 'lucide-react'
import { APP_VERSION } from '@/shared/config/navigation'
import { Button } from '@/shared/ui/button'
import { usePaletteStore } from '@/features/command-palette/model/palette-store'
import { useShellStore } from '@/features/shell/model/shell-store'
import { useThemeStore } from '@/features/theme/model/theme-store'
import { useWorkspaceStore } from '@/features/workspace/model/workspace-store'

export function AppTopbar() {
  const toggleSidebar = useShellStore((s) => s.toggleSidebar)
  const mode = useThemeStore((s) => s.mode)
  const cycleMode = useThemeStore((s) => s.cycleMode)
  const summary = useWorkspaceStore((s) => s.summary)
  const togglePalette = usePaletteStore((s) => s.toggle)

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] px-3">
      <Button variant="ghost" size="icon" aria-label="Toggle sidebar" onClick={toggleSidebar}>
        <PanelLeft className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-1.5 text-[12px] text-[var(--color-text-secondary)]">
        <span className="rounded-[6px] bg-[var(--color-bg-subtle)] px-2 py-1 font-medium text-[var(--color-text-primary)]">
          {summary?.product.key ?? 'CKI'}
        </span>
        <span>·</span>
        <span>{summary?.quarter?.key ?? '—'}</span>
        <span>·</span>
        <span>{summary?.sprint?.name ?? 'No sprint'}</span>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <Button variant="ghost" size="sm" className="gap-1.5 text-[var(--color-text-secondary)]" disabled>
          <Search className="h-3.5 w-3.5" />
          Search
          <kbd className="rounded border border-[var(--color-border-subtle)] px-1 text-[10px]">⌘P</kbd>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-[var(--color-text-secondary)]"
          onClick={() => togglePalette()}
        >
          <Command className="h-3.5 w-3.5" />
          Commands
          <kbd className="rounded border border-[var(--color-border-subtle)] px-1 text-[10px]">⌘K</kbd>
        </Button>
        <Button variant="ghost" size="icon" aria-label="Notifications" disabled>
          <Bell className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Theme: ${mode}`}
          title={`Theme: ${mode}`}
          onClick={cycleMode}
        >
          {mode === 'light' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <span className="ml-1 text-[11px] text-[var(--color-text-tertiary)]">v{APP_VERSION}</span>
      </div>
    </header>
  )
}
