import { liveGetCompaniesList, liveGetCompanyProfile } from '../api/live/moexLive'
import { withLiveFallback } from '../api/withFallback'
import { mockCompanies, mockCompanyKpis, mockCompanyProfiles } from './mocks'
import type { CompanyListItem, CompanyComparisonItem } from '../../types/companyComparison'
import type { CompanyProfile, CompanyKpiSnapshot } from '../../types/company'
import { nsdGetCompanyKpiHistory } from './companies'

export type CompaniesListResult = {
  items: CompanyListItem[]
  source: 'live' | 'mock'
}

export async function nsdGetCompaniesList(params?: {
  q?: string
  sector?: string
  industry?: string
  limit?: number
  page?: number
}): Promise<CompaniesListResult> {
  const { data, source } = await withLiveFallback(
    () => liveGetCompaniesList(params),
    async () => {
      let items = mockCompanies.map((c) => ({
        id: c.id,
        name: c.name,
        ticker: c.ticker,
        isin: c.isin,
        sector: c.sector,
        industry: c.industry,
        country: c.country,
      }))

      if (params?.q) {
        const q = params.q.toLowerCase()
        items = items.filter((c) =>
          c.name.toLowerCase().includes(q)
          || c.ticker.toLowerCase().includes(q)
          || c.isin.toLowerCase().includes(q),
        )
      }
      if (params?.sector) items = items.filter((c) => c.sector === params.sector)
      if (params?.industry) items = items.filter((c) => c.industry === params.industry)
      if (params?.limit) items = items.slice(0, params.limit)
      return items
    },
  )

  return { items: data, source }
}

export async function nsdGetCompaniesComparison(ids: string[]): Promise<CompanyComparisonItem[]> {
  return Promise.all(ids.map(async (id) => {
    const { data: profile } = await withLiveFallback(
      () => liveGetCompanyProfile(id),
      async () => mockCompanyProfiles[id] ?? null,
    )

    const history = await nsdGetCompanyKpiHistory(id)

    return {
      id,
      name: profile?.name ?? id,
      ticker: profile?.ticker ?? '—',
      isin: profile?.isin ?? '—',
      sector: profile?.sector ?? '—',
      industry: profile?.industry ?? '—',
      country: profile?.country ?? 'Россия',
      latestKpi: history?.[0],
    }
  }))
}
