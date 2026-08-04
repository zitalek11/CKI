import { getApiMode, shouldTryLive } from './config'

export async function withLiveFallback<T>(
  liveFn: () => Promise<T>,
  mockFn: () => Promise<T>,
): Promise<{ data: T; source: 'live' | 'mock' }> {
  if (!shouldTryLive()) {
    return { data: await mockFn(), source: 'mock' }
  }

  try {
    const data = await liveFn()
    return { data, source: 'live' }
  } catch (error) {
    if (getApiMode() === 'live') throw error
    return { data: await mockFn(), source: 'mock' }
  }
}
