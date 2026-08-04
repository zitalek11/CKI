import { getApiMode, getApiModeLabel, hasMoexCredentials } from '../services/api/config'

export function useApiMode() {
  const mode = getApiMode()
  return {
    mode,
    label: getApiModeLabel(mode),
    hasCredentials: hasMoexCredentials(),
    isMock: mode === 'mock',
    isLive: mode === 'live',
    isAuto: mode === 'auto',
  }
}

/** @deprecated use useApiMode */
export const useMockMode = () => useApiMode().isMock
