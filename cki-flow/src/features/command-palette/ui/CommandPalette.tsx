import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePaletteStore } from '@/features/command-palette/model/palette-store'
import { useThemeStore } from '@/features/theme/model/theme-store'
import { useWorkspaceStore } from '@/features/workspace/model/workspace-store'
import { cn } from '@/shared/lib/cn'

type Command = {
  id: string
  label: string
  hint?: string
  run: () => void
}

export function CommandPalette() {
  const open = usePaletteStore((s) => s.open)
  const setOpen = usePaletteStore((s) => s.setOpen)
  const toggle = usePaletteStore((s) => s.toggle)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const cycleMode = useThemeStore((s) => s.cycleMode)
  const resetDemoData = useWorkspaceStore((s) => s.resetDemoData)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        toggle()
        setQuery('')
      }
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [setOpen, toggle])

  const commands = useMemo<Command[]>(
    () => [
      { id: 'today', label: 'Go to Today', hint: 'g t', run: () => navigate('/') },
      { id: 'sprint', label: 'Go to Sprint', run: () => navigate('/plan/sprint') },
      { id: 'quarter', label: 'Go to Quarter', run: () => navigate('/plan/quarter') },
      { id: 'backlog', label: 'Go to Backlog', run: () => navigate('/deliver/backlog') },
      { id: 'board', label: 'Go to Board', run: () => navigate('/deliver/board') },
      { id: 'roadmap', label: 'Go to Roadmap', run: () => navigate('/deliver/roadmap') },
      { id: 'releases', label: 'Go to Releases', run: () => navigate('/deliver/releases') },
      { id: 'load', label: 'Go to Load', run: () => navigate('/insights/load') },
      { id: 'risks', label: 'Go to Risks', run: () => navigate('/insights/risks') },
      { id: 'analytics', label: 'Go to Analytics', run: () => navigate('/insights/analytics') },
      { id: 'templates', label: 'Go to Templates', run: () => navigate('/system/templates') },
      { id: 'settings', label: 'Go to Settings', run: () => navigate('/system/settings') },
      { id: 'theme', label: 'Cycle theme', run: () => cycleMode() },
      { id: 'reset', label: 'Reset demo data', run: () => void resetDemoData() },
    ],
    [navigate, cycleMode, resetDemoData],
  )

  const filtered = commands.filter((command) =>
    command.label.toLowerCase().includes(query.trim().toLowerCase()),
  )

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/35 p-6 pt-[12vh]"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onClick={(event) => event.stopPropagation()}
      >
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Type a command…"
          className="h-12 w-full border-b border-[var(--color-border-subtle)] bg-transparent px-4 outline-none"
          onKeyDown={(event) => {
            if (event.key === 'Enter' && filtered[0]) {
              filtered[0].run()
              setOpen(false)
            }
          }}
        />
        <ul className="max-h-80 overflow-auto p-2">
          {filtered.length === 0 && (
            <li className="px-2 py-3 text-[12px] text-[var(--color-text-tertiary)]">No commands</li>
          )}
          {filtered.map((command, index) => (
            <li key={command.id}>
              <button
                type="button"
                className={cn(
                  'flex w-full items-center justify-between rounded-[var(--radius-sm)] px-3 py-2 text-left text-[13px] hover:bg-[var(--color-accent-muted)]',
                  index === 0 && 'bg-[var(--color-accent-muted)]',
                )}
                onClick={() => {
                  command.run()
                  setOpen(false)
                }}
              >
                <span>{command.label}</span>
                {command.hint && (
                  <kbd className="text-[10px] text-[var(--color-text-tertiary)]">{command.hint}</kbd>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
