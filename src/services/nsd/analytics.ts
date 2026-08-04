import { liveGetCompanyFinancialLines, liveGetCompanyProfile } from '../api/live/moexLive'
import { withLiveFallback } from '../api/withFallback'
import { calculateIndicators } from '../analytics/indicators'
import { financialLinesFromSnapshot } from '../analytics/financialLines'
import { mockCompanies, mockCompanyKpis, mockCompanyProfiles } from './mocks'
import type { ComparisonIndicatorsResult, CompanyIndicatorsResult } from '../../types/financialIndicators'

async function resolveCompanyMeta(companyId: string) {
  const { data: profile } = await withLiveFallback(
    () => liveGetCompanyProfile(companyId),
    async () => mockCompanyProfiles[companyId] ?? null,
  )
  const mockMeta = mockCompanies.find((c) => c.id === companyId)
  return {
    name: profile?.name ?? mockMeta?.name ?? companyId,
    ticker: profile?.ticker ?? mockMeta?.ticker ?? '—',
  }
}

async function loadCompanyFinancialLines(companyId: string, reportId?: string) {
  return withLiveFallback(
    () => liveGetCompanyFinancialLines(companyId, reportId),
    async () => {
      const profile = mockCompanyProfiles[companyId]
      const kpi = mockCompanyKpis[companyId]?.[0]
      if (!kpi) return null

      return financialLinesFromSnapshot(
        companyId,
        kpi.date,
        {
          revenue: kpi.revenue,
          ebitda: kpi.ebitda,
          netProfit: kpi.netProfit,
          assets: kpi.assets,
          equity: kpi.equity,
          debt: kpi.debt,
        },
      )
    },
  )
}

export async function nsdCalculateComparisonIndicators(
  companyIds: string[],
  reportId?: string,
): Promise<ComparisonIndicatorsResult> {
  const companies: CompanyIndicatorsResult[] = []

  for (const companyId of companyIds) {
    const { data: lines, source } = await loadCompanyFinancialLines(companyId, reportId)
    if (!lines) continue

    const meta = await resolveCompanyMeta(companyId)

    companies.push({
      companyId,
      companyName: meta.name,
      ticker: meta.ticker,
      period: lines.period,
      reportId: lines.reportId,
      source,
      lines,
      indicators: calculateIndicators(lines),
    })
  }

  return {
    companies,
    calculatedAt: new Date().toISOString(),
  }
}

export async function nsdGetComparisonCompaniesMeta(companyIds: string[]) {
  return Promise.all(
    companyIds.map(async (id) => {
      const meta = await resolveCompanyMeta(id)
      return { id, ...meta }
    }),
  )
}
