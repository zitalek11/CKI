export type ApiMode = 'mock' | 'live' | 'auto'

export function getApiMode(): ApiMode {
  const mode = import.meta.env.VITE_API_MODE as ApiMode | undefined
  if (mode === 'mock' || mode === 'live' || mode === 'auto') return mode
  return 'auto'
}

export function shouldUseMock(force?: boolean): boolean {
  if (force !== undefined) return force
  return getApiMode() === 'mock'
}

export function shouldTryLive(): boolean {
  const mode = getApiMode()
  return mode === 'live' || mode === 'auto'
}

export function hasMoexCredentials(): boolean {
  return Boolean(import.meta.env.VITE_MOEX_USER && import.meta.env.VITE_MOEX_PASSWORD)
}

export function getApiModeLabel(mode: ApiMode = getApiMode()): string {
  if (mode === 'mock') return 'Mock mode'
  if (mode === 'live') return 'Live API'
  return hasMoexCredentials() ? 'Auto · live + fallback' : 'Auto · public endpoints'
}
