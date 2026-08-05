import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  CalendarRange,
  FileInput,
  Gauge,
  GitBranch,
  Inbox,
  LayoutGrid,
  Map,
  Package,
  Settings,
  ShieldAlert,
  Timer,
  Workflow,
} from 'lucide-react'

export type NavItem = {
  id: string
  label: string
  path: string
  icon: LucideIcon
}

export type NavGroup = {
  id: string
  label: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'today',
    label: 'Today',
    items: [{ id: 'today', label: 'Today', path: '/', icon: Inbox }],
  },
  {
    id: 'plan',
    label: 'Plan',
    items: [
      { id: 'quarter', label: 'Quarter', path: '/plan/quarter', icon: CalendarRange },
      { id: 'sprint', label: 'Sprint', path: '/plan/sprint', icon: Timer },
    ],
  },
  {
    id: 'deliver',
    label: 'Deliver',
    items: [
      { id: 'backlog', label: 'Backlog', path: '/deliver/backlog', icon: LayoutGrid },
      { id: 'board', label: 'Board', path: '/deliver/board', icon: GitBranch },
      { id: 'roadmap', label: 'Roadmap', path: '/deliver/roadmap', icon: Map },
      { id: 'releases', label: 'Releases', path: '/deliver/releases', icon: Package },
    ],
  },
  {
    id: 'insights',
    label: 'Insights',
    items: [
      { id: 'load', label: 'Load', path: '/insights/load', icon: Gauge },
      { id: 'risks', label: 'Risks', path: '/insights/risks', icon: ShieldAlert },
      { id: 'analytics', label: 'Analytics', path: '/insights/analytics', icon: Activity },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [
      { id: 'templates', label: 'Templates', path: '/system/templates', icon: Workflow },
      { id: 'migration', label: 'Migration', path: '/system/migration', icon: FileInput },
      { id: 'settings', label: 'Settings', path: '/system/settings', icon: Settings },
    ],
  },
]

export const APP_NAME = 'CKI Flow'
export const APP_VERSION = '0.1.0'
