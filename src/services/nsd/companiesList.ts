import { liveGetCompaniesList, liveGetCompanyProfile } from '../api/live/moexLive'
import type { CompaniesListParams } from '../api/live/moexLive'
import { withLiveFallback } from '../api/withFallback'
import { buildPagination, type PaginatedResult } from '../api/types'
import { mockCompanies, mockCompanyKpis, mockCompanyProfiles } from './mocks'
import type { CompanyListItem, CompanyComparisonItem } from '../../types/companyComparison'
import { nsdGetCompanyKpiHistory } from './companies'

export type CompaniesListResult = PaginatedResult<CompanyListItem> & {
  source: 'live' | 'mock'
}

function mockCompaniesList(params?: CompaniesListParams): PaginatedResult<CompanyListItem> {
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
  if (params?.sector) {
    const q = params.sector.toLowerCase()
    items = items.filter((c) => c.sector.toLowerCase().includes(q))
  }
  if (params?.industry) {
    const q = params.industry.toLowerCase()
    items = items.filter((c) => c.industry.toLowerCase().includes(q))
  }

  const total = items.length
  const page = params?.page ?? 1
  const pageSize = params?.limit ?? (params?.fetchAll ? total : 50)

  if (!params?.fetchAll && pageSize > 0) {
    const start = (page - 1) * pageSize
    items = items.slice(start, start + pageSize)
  }

  return {
    items,
    pagination: buildPagination(page, pageSize, total),
  }
}

export async function nsdGetCompaniesList(params?: CompaniesListParams): Promise<CompaniesListResult> {
  const { data, source } = await withLiveFallback(
    () => liveGetCompaniesList(params),
    async () => mockCompaniesList(params),
  )

  return { ...data, source }
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

/** Fetch all companies from API into service layer (for sync / export scenarios). */
export async function nsdFetchAllCompanies(params?: Omit<CompaniesListParams, 'fetchAll' | 'page' | 'limit'>) {
  return nsdGetCompaniesList({ ...params, fetchAll: true })
}

export type { CompaniesListParams }
