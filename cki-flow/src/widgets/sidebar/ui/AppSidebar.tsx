import { NavLink } from 'react-router-dom'
import { APP_NAME, NAV_GROUPS } from '@/shared/config/navigation'
import { cn } from '@/shared/lib/cn'
import { useShellStore } from '@/features/shell/model/shell-store'

export function AppSidebar() {
  const collapsed = useShellStore((s) => s.sidebarCollapsed)

  return (
    <aside
      className={cn(
        'flex h-full shrink-0 flex-col border-r border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] transition-[width] duration-150',
        collapsed ? 'w-[64px]' : 'w-[220px]',
      )}
    >
      <div className={cn('flex h-12 items-center border-b border-[var(--color-border-subtle)] px-3', collapsed && 'justify-center')}>
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-[8px] bg-[var(--color-accent)] text-[11px] font-semibold text-white">
            CF
          </span>
          {!collapsed && (
            <div className="leading-tight">
              <div className="text-[13px] font-semibold">{APP_NAME}</div>
              <div className="text-[11px] text-[var(--color-text-tertiary)]">Product workspace</div>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {NAV_GROUPS.map((group) => (
          <div key={group.id} className="mb-3">
            {!collapsed && (
              <div className="mb-1 px-2 text-[10px] font-semibold tracking-wide text-[var(--color-text-tertiary)] uppercase">
                {group.label}
              </div>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.id}>
                    <NavLink
                      to={item.path}
                      end={item.path === '/'}
                      title={item.label}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-[13px] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-surface)] hover:text-[var(--color-text-primary)]',
                          collapsed && 'justify-center px-0',
                          isActive &&
                            'bg-[var(--color-accent-muted)] font-medium text-[var(--color-accent)] hover:bg-[var(--color-accent-muted)] hover:text-[var(--color-accent)]',
                        )
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden />
                      {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}
