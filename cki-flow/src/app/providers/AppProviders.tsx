import { useEffect, type ReactNode } from 'react'
import { HashRouter } from 'react-router-dom'
import { ErrorBoundary } from '@/app/providers/ErrorBoundary'
import { useShellStore } from '@/features/shell/model/shell-store'
import { applyThemeMode, useThemeStore } from '@/features/theme/model/theme-store'

type AppProvidersProps = {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  const mode = useThemeStore((s) => s.mode)

  useEffect(() => {
    applyThemeMode(mode)

    if (mode !== 'system') return

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyThemeMode('system')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [mode])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const withCmd = event.metaKey || event.ctrlKey

      if (withCmd && event.shiftKey && event.key.toLowerCase() === 'l') {
        event.preventDefault()
        useThemeStore.getState().cycleMode()
      }

      if (withCmd && event.key === '\\') {
        event.preventDefault()
        useShellStore.getState().toggleSidebar()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <ErrorBoundary>
      {/* HashRouter: required for Tauri asset:// protocol in production builds */}
      <HashRouter>{children}</HashRouter>
    </ErrorBoundary>
  )
}
