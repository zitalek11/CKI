import { Link, useLocation } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { NAV_GROUPS } from '@/shared/config/navigation'
import { cn } from '@/shared/lib/cn'

function resolveCrumbs(pathname: string) {
  const crumbs: Array<{ label: string; path?: string }> = [{ label: 'CKI Flow', path: '/' }]
  if (pathname === '/' || pathname === '') return crumbs

  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (item.path === pathname || (item.path !== '/' && pathname.startsWith(item.path))) {
        if (group.id !== 'today') {
          crumbs.push({ label: group.label })
        }
        crumbs.push({ label: item.label, path: item.path })
        return crumbs
      }
    }
  }

  crumbs.push({ label: pathname })
  return crumbs
}

export function AppBreadcrumbs() {
  const location = useLocation()
  const crumbs = resolveCrumbs(location.pathname)

  return (
    <nav
      aria-label="Хлебные крошки"
      className="flex items-center gap-1 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] px-4 py-1.5 text-[12px] text-[var(--color-text-tertiary)]"
    >
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1
        return (
          <span key={`${crumb.label}-${index}`} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="h-3 w-3 opacity-60" />}
            {crumb.path && !isLast ? (
              <Link
                to={crumb.path}
                className="hover:text-[var(--color-text-primary)]"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className={cn(isLast && 'font-medium text-[var(--color-text-secondary)]')}>
                {crumb.label}
              </span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
