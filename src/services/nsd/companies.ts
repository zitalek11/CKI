import { liveGetCompanyProfile, liveGetCompanyKpiHistory, liveGetCompanyReports } from '../api/live/moexLive'
import { withLiveFallback } from '../api/withFallback'
import type { CompanyProfile, CompanyKpiSnapshot } from '../../types/company'
import { mockCompanyProfiles, mockCompanyKpis } from './mocks'

export async function nsdGetCompanyProfile(id: string): Promise<CompanyProfile | null> {
  const { data } = await withLiveFallback(
    async () => {
      const profile = await liveGetCompanyProfile(id)
      if (!profile) return null
      const reports = await liveGetCompanyReports(id).catch(() => [])
      return { ...profile, reports }
    },
    async () => mockCompanyProfiles[id] ?? null,
  )
  return data
}

export async function nsdGetCompanyKpiHistory(id: string): Promise<CompanyKpiSnapshot[]> {
  const { data } = await withLiveFallback(
    () => liveGetCompanyKpiHistory(id),
    async () => mockCompanyKpis[id] ?? [],
  )
  return data
}
