import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { logger } from '@/shared/lib/logger'

export type ThemeMode = 'light' | 'dark' | 'system'

type ThemeState = {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  cycleMode: () => void
}

function resolveSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyThemeMode(mode: ThemeMode): void {
  const resolved = mode === 'system' ? resolveSystemTheme() : mode
  document.documentElement.classList.toggle('dark', resolved === 'dark')
  document.documentElement.dataset.theme = resolved
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'system',
      setMode: (mode) => {
        applyThemeMode(mode)
        logger.info('Theme changed', { mode }, 'theme')
        set({ mode })
      },
      cycleMode: () => {
        const order: ThemeMode[] = ['light', 'dark', 'system']
        const current = get().mode
        const next = order[(order.indexOf(current) + 1) % order.length] ?? 'system'
        get().setMode(next)
      },
    }),
    {
      name: 'cki-flow.theme',
      onRehydrateStorage: () => (state) => {
        applyThemeMode(state?.mode ?? 'system')
      },
    },
  ),
)
