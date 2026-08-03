import { isMockMode, nsdClient } from './client'
import { mockCompanies } from './mocks'
import type { Company, CompanyKpiSnapshot } from '../../types/company'

export async function nsdSearchCompanies(query: string): Promise<{ results: Company[] }> {
  if (isMockMode) {
    const q = query.toLowerCase()
    return {
      results: mockCompanies.filter((c) => c.name.toLowerCase().includes(q) || c.ticker.toLowerCase().includes(q) || c.isin.toLowerCase().includes(q)),
    }
  }

  const { data } = await nsdClient.get('/api/getcompanies', { params: { q: query, limit: 20 } })
  return { results: data.companies as Company[] }
}

export async function nsdGetCompanyById(id: string): Promise<Company> {
  if (isMockMode) {
    const company = mockCompanies.find((c) => c.id === id)
    if (!company) throw new Error('Компания не найдена')
    return company
  }

  const { data } = await nsdClient.get('/api/getcompanies', { params: { id } })
  return data.company as Company
}

export async function nsdGetCompanyKpiHistory(id: string): Promise<CompanyKpiSnapshot[]> {
  if (isMockMode) {
    const now = new Date()
    return Array.from({ length: 16 }).map((_, i) => {
      const d = new Date(now)
      d.setMonth(now.getMonth() - i * 3)
      return {
        date: d.toISOString(),
        revenue: 1000000000 + i * 50000000,
        ebitda: 300000000 + i * 20000000,
        netProfit: 200000000 + i * 15000000,
        assets: 5000000000 + i * 100000000,
        equity: 2000000000 + i * 50000000,
        debt: 1500000000 + i * 70000000,
        roe: 0.18 + i * 0.002,
        roa: 0.08 + i * 0.001,
        debtToEbitda: 3 - i * 0.05,
        dividendYield: 0.08 + i * 0.003,
        marginNet: 0.22 + i * 0.004,
      }
    })
  }

  const { data } = await nsdClient.get('/api/getcompanymetrics', { params: { companyId: id, period: 'quarter', statements: 'IFRS' } })
  return data.series as CompanyKpiSnapshot[]
}
