import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import {
  Activity,
  Building2,
  CalendarDays,
  Code2,
  LayoutDashboard,
  Sparkles,
} from 'lucide-react'
import { getApiModeLabel } from '../services/api/config'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/ask', label: 'Ask AI', icon: Sparkles },
  { to: '/companies', label: 'Компании', icon: Building2 },
  { to: '/analytics/banks', label: 'Аналитика', icon: Activity },
  { to: '/corporate-actions', label: 'Корп. действия', icon: CalendarDays },
  { to: '/api-explorer', label: 'API Explorer', icon: Code2 },
] as const

export function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const apiModeLabel = getApiModeLabel()

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">CKI</div>
          <div>
            <div className="sidebar-title">Corporate Intelligence</div>
            <div className="sidebar-subtitle">NSD Data Hub · {apiModeLabel}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = to === '/' ? pathname === '/' : pathname.startsWith(to)
            return (
              <Link key={to} to={to} className={`nav-link${active ? ' active' : ''}`}>
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
