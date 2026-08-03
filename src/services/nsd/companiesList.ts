import { isMockMode, nsdClient } from './client'
import { mockCompanies } from './mocks'
import type { CompanyListItem, CompanyComparisonItem } from '../../types/companyComparison'
import { nsdGetCompanyKpiHistory } from './companies'

export async function nsdGetCompaniesList(params?: { sector?: string; industry?: string; limit?: number }): Promise<CompanyListItem[]> {
  if (isMockMode) {
    return mockCompanies.map((c) => ({
      id: c.id,
      name: c.name,
      ticker: c.ticker,
      isin: c.isin,
      sector: c.sector,
      industry: c.industry,
      country: c.country,
    }))
  }

  const { data } = await nsdClient.get('/api/getcompanies', {
    params: { sector: params?.sector, industry: params?.industry, limit: params?.limit ?? 100 },
  })

  return (data.companies ?? []) as CompanyListItem[]
}

export async function nsdGetCompaniesComparison(ids: string[]): Promise<CompanyComparisonItem[]> {
  return Promise.all(ids.map(async (id) => {
    const { data } = await nsdClient.get('/api/getcompanies', { params: { id } })
    const history = await nsdGetCompanyKpiHistory(id)
    return {
      id,
      name: data.company.name,
      ticker: data.company.ticker,
      isin: data.company.isin,
      sector: data.company.sector,
      industry: data.company.industry,
      country: data.company.country,
      latestKpi: history?.[0],
    }
  }))
}
