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
  Users,
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
    label: 'Сегодня',
    items: [{ id: 'today', label: 'Сегодня', path: '/', icon: Inbox }],
  },
  {
    id: 'plan',
    label: 'План',
    items: [
      { id: 'quarter', label: 'Квартал', path: '/plan/quarter', icon: CalendarRange },
      { id: 'sprint', label: 'Спринт', path: '/plan/sprint', icon: Timer },
    ],
  },
  {
    id: 'deliver',
    label: 'Поставка',
    items: [
      { id: 'backlog', label: 'Бэклог', path: '/deliver/backlog', icon: LayoutGrid },
      { id: 'board', label: 'Доска', path: '/deliver/board', icon: GitBranch },
      { id: 'roadmap', label: 'Дорожная карта', path: '/deliver/roadmap', icon: Map },
      { id: 'releases', label: 'Релизы', path: '/deliver/releases', icon: Package },
    ],
  },
  {
    id: 'insights',
    label: 'Аналитика',
    items: [
      { id: 'load', label: 'Загрузка', path: '/insights/load', icon: Gauge },
      { id: 'risks', label: 'Риски', path: '/insights/risks', icon: ShieldAlert },
      { id: 'analytics', label: 'Пульс', path: '/insights/analytics', icon: Activity },
    ],
  },
  {
    id: 'system',
    label: 'Система',
    items: [
      { id: 'team', label: 'Команда', path: '/system/team', icon: Users },
      { id: 'templates', label: 'Шаблоны', path: '/system/templates', icon: Workflow },
      { id: 'migration', label: 'Миграция', path: '/system/migration', icon: FileInput },
      { id: 'settings', label: 'Настройки', path: '/system/settings', icon: Settings },
    ],
  },
]

export const APP_NAME = 'CKI Flow'
export const APP_VERSION = '1.1.0'
