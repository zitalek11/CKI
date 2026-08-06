import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Command, Moon, Package, PanelLeft, Search, Sun } from 'lucide-react'
import { appServices } from '@/application/composition'
import type { Quarter, Release, Sprint } from '@/domain/model/entities'
import { APP_VERSION } from '@/shared/config/navigation'
import { Button } from '@/shared/ui/button'
import { usePaletteStore } from '@/features/command-palette/model/palette-store'
import { useShellStore } from '@/features/shell/model/shell-store'
import { useThemeStore } from '@/features/theme/model/theme-store'
import { useWorkspaceStore } from '@/features/workspace/model/workspace-store'
import { labelTheme } from '@/shared/lib/labels'

const selectClass =
  'h-7 rounded-[6px] border border-transparent bg-[var(--color-bg-subtle)] px-2 text-[12px] font-medium text-[var(--color-text-primary)] outline-none hover:border-[var(--color-border-subtle)] focus:border-[var(--color-accent)]'

export function AppTopbar() {
  const toggleSidebar = useShellStore((s) => s.toggleSidebar)
  const mode = useThemeStore((s) => s.mode)
  const cycleMode = useThemeStore((s) => s.cycleMode)
  const summary = useWorkspaceStore((s) => s.summary)
  const refreshWorkspace = useWorkspaceStore((s) => s.refresh)
  const togglePalette = usePaletteStore((s) => s.toggle)

  const [quarters, setQuarters] = useState<Quarter[]>([])
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [activeRelease, setActiveRelease] = useState<Release | null>(null)
  const [switching, setSwitching] = useState(false)

  useEffect(() => {
    if (!summary) return
    const productId = summary.product.id
    void appServices.quarters.listAll(productId).then(setQuarters)
    void appServices.sprints.listAll(productId).then(setSprints)
    void appServices.releases.list(productId).then((releases) => {
      setActiveRelease(
        releases.find((item) => item.status === 'in_progress' || item.status === 'code_freeze') ??
          releases[0] ??
          null,
      )
    })
  }, [summary, summary?.quarter?.id, summary?.sprint?.id])

  const onSwitchQuarter = async (quarterId: string) => {
    if (!summary || !quarterId || quarterId === summary.quarter?.id) return
    setSwitching(true)
    try {
      await appServices.quarters.activate({ productId: summary.product.id, quarterId })
      await refreshWorkspace()
    } finally {
      setSwitching(false)
    }
  }

  const onSwitchSprint = async (sprintId: string) => {
    if (!summary || !sprintId || sprintId === summary.sprint?.id) return
    setSwitching(true)
    try {
      await appServices.sprints.activate({ productId: summary.product.id, sprintId })
      await refreshWorkspace()
    } finally {
      setSwitching(false)
    }
  }

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] px-3">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Переключить боковую панель"
        onClick={toggleSidebar}
      >
        <PanelLeft className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-1.5 text-[12px] text-[var(--color-text-secondary)]">
        <span className="rounded-[6px] bg-[var(--color-bg-subtle)] px-2 py-1 font-medium text-[var(--color-text-primary)]">
          {summary?.product.key ?? 'CKI'}
        </span>
        <span>·</span>
        <select
          title="Активный квартал"
          className={selectClass}
          value={summary?.quarter?.id ?? ''}
          disabled={switching || quarters.length === 0}
          onChange={(event) => void onSwitchQuarter(event.target.value)}
        >
          {!summary?.quarter && <option value="">Нет квартала</option>}
          {quarters.map((quarter) => (
            <option key={quarter.id} value={quarter.id}>
              {quarter.key}
            </option>
          ))}
        </select>
        <span>·</span>
        <select
          title="Активный спринт"
          className={selectClass}
          value={summary?.sprint?.id ?? ''}
          disabled={switching || sprints.length === 0}
          onChange={(event) => void onSwitchSprint(event.target.value)}
        >
          {!summary?.sprint && <option value="">Нет спринта</option>}
          {sprints.map((sprint) => (
            <option key={sprint.id} value={sprint.id}>
              {sprint.name}
            </option>
          ))}
        </select>
        {activeRelease && (
          <>
            <span>·</span>
            <Link
              to="/deliver/releases"
              title="Активный релиз"
              className="inline-flex h-7 items-center gap-1 rounded-[6px] bg-[var(--color-bg-subtle)] px-2 font-medium text-[var(--color-text-primary)]"
            >
              <Package className="h-3.5 w-3.5" />
              {activeRelease.name}
            </Link>
          </>
        )}
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-[var(--color-text-secondary)]"
          disabled
        >
          <Search className="h-3.5 w-3.5" />
          Поиск
          <kbd className="rounded border border-[var(--color-border-subtle)] px-1 text-[10px]">
            ⌘P
          </kbd>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-[var(--color-text-secondary)]"
          onClick={() => togglePalette()}
        >
          <Command className="h-3.5 w-3.5" />
          Команды
          <kbd className="rounded border border-[var(--color-border-subtle)] px-1 text-[10px]">
            ⌘K
          </kbd>
        </Button>
        <Button variant="ghost" size="icon" aria-label="Уведомления" disabled>
          <Bell className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Тема: ${labelTheme(mode)}`}
          title={`Тема: ${labelTheme(mode)}`}
          onClick={cycleMode}
        >
          {mode === 'light' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <span className="ml-1 text-[11px] text-[var(--color-text-tertiary)]">v{APP_VERSION}</span>
      </div>
    </header>
  )
}
