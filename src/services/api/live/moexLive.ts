import { cciApiClient, issClient } from '../../nsd/client'
import { parseIssTable, readMoexJson } from '../issTable'
import type {
  MoexCompanyIndustryRecord,
  MoexCompanyRecord,
  MoexCouponRecord,
  MoexDividendRecord,
  MoexMsfoReportRecord,
  MoexMsfoReportValueRecord,
  MoexNewApiListResponse,
} from '../moexTypes'
import type { CompanyListItem } from '../../../types/companyComparison'
import type { CompanyProfile, CompanyKpiSnapshot, CompanyReport } from '../../../types/company'
import type {
  CompanyCorporateActionItem,
  CorporateActionCalendarItem,
  CorporateActionFeedItem,
} from '../../../types/corporateAction'

const industryCache = new Map<number, string>()
let industryLoadPromise: Promise<Map<number, string>> | null = null

async function loadIndustryMap(limit = 200): Promise<Map<number, string>> {
  if (industryCache.size > 0) return industryCache
  if (industryLoadPromise) return industryLoadPromise

  industryLoadPromise = issClient.get('/cci/info/companies/industry-codes.json', {
    params: { limit },
    timeout: 8000,
  }).then((response) => {
    const rows = parseIssTable<MoexCompanyIndustryRecord>(response.data?.cci_company_industry)
    rows.forEach((row) => {
      if (row.basis_company_id && row.industry_name_short_ru) {
        industryCache.set(row.basis_company_id, row.industry_name_short_ru)
      }
    })
    return industryCache
  }).catch(() => industryCache).finally(() => {
    industryLoadPromise = null
  })

  return industryLoadPromise
}

async function loadIndustryMapWithTimeout(timeoutMs = 2500): Promise<Map<number, string>> {
  return Promise.race([
    loadIndustryMap(),
    new Promise<Map<number, string>>((resolve) => {
      setTimeout(() => resolve(industryCache), timeoutMs)
    }),
  ])
}

function companyId(id: number | string) {
  return String(id)
}

function mapCompanyListItem(
  record: MoexCompanyRecord,
  industry?: string,
): CompanyListItem {
  return {
    id: companyId(record.basis_company_id),
    name: record.name_short_ru ?? record.name_full_ru ?? `Company ${record.basis_company_id}`,
    ticker: '—',
    isin: '—',
    sector: industry ?? '—',
    industry: industry ?? '—',
    country: record.nation_name_short_ru ?? 'Россия',
  }
}

export async function liveGetCompaniesList(params?: {
  q?: string
  sector?: string
  industry?: string
  limit?: number
  page?: number
}): Promise<CompanyListItem[]> {
  const limit = Math.max(params?.limit ?? 50, 10)
  const industryMap = await loadIndustryMapWithTimeout()

  try {
    const { data } = await cciApiClient.get<MoexNewApiListResponse<MoexCompanyRecord>>('/info/companies', {
      params: {
        page: params?.page ?? 1,
        limit,
        q: params?.q || undefined,
      },
    })

    let items = (data.data ?? []).map((record) => {
      const industry = industryMap.get(record.basis_company_id)
      return mapCompanyListItem(record, industry)
    })

    if (params?.sector) items = items.filter((item) => item.sector === params.sector)
    if (params?.industry) items = items.filter((item) => item.industry === params.industry)

    return items
  } catch {
    const { data } = await issClient.get('/cci/info/companies.json', {
      params: {
        q: params?.q || undefined,
        limit: params?.limit ?? 100,
        start: ((params?.page ?? 1) - 1) * (params?.limit ?? 100),
      },
    })

    const rows = parseIssTable<MoexCompanyRecord>(data?.cci_companies)
    let items = rows.map((record) => {
      const industry = industryMap.get(record.basis_company_id)
      return mapCompanyListItem(record, industry)
    })

    if (params?.sector) items = items.filter((item) => item.sector === params.sector)
    if (params?.industry) items = items.filter((item) => item.industry === params.industry)

    return items
  }
}

export async function liveGetCompanyProfile(id: string): Promise<CompanyProfile | null> {
  const response = await issClient.get(`/cci/info/companies/${id}.json`)
  const rows = parseIssTable<MoexCompanyRecord>(response.data?.cci_company)
  const record = rows[0]
  if (!record) return null

  const industryMap = await loadIndustryMap()
  const industry = industryMap.get(record.basis_company_id)

  return {
    id: companyId(record.basis_company_id),
    name: record.name_short_ru ?? record.name_full_ru ?? `Company ${id}`,
    ticker: '—',
    isin: '—',
    sector: industry ?? '—',
    industry: industry ?? '—',
    country: record.nation_name_short_ru ?? 'Россия',
    status: 'listed',
    description: record.address ?? undefined,
    exchange: 'МосБиржа',
    reports: [],
    snapshot: undefined,
  }
}

export async function liveGetCorporateActionsFeed(limit = 20): Promise<CorporateActionFeedItem[]> {
  const { data } = await issClient.get('/cci/corp-actions/dividends.json', { params: { limit } })
  const rows = parseIssTable<MoexDividendRecord>(data?.cci_corp_actions_dividends)

  return rows.map((row) => ({
    id: String(row.basis_corp_action_id),
    title: `${row.company_name_full_ru ?? 'Эмитент'} — ${row.corp_action_type_name ?? 'дивиденды'}`,
    date: (row.update_time ?? '').slice(0, 10) || '—',
    sector: '—',
    type: 'dividend',
  }))
}

export async function liveGetCorporateActionsCalendar(limit = 20): Promise<CorporateActionCalendarItem[]> {
  const [dividendsRes, couponsRes] = await Promise.all([
    issClient.get('/cci/corp-actions/dividends.json', { params: { limit } }),
    issClient.get('/cci/corp-actions/coupons.json', { params: { limit } }),
  ])

  const dividends = parseIssTable<MoexDividendRecord>(dividendsRes.data?.cci_corp_actions_dividends)
  const coupons = parseIssTable<MoexCouponRecord>(couponsRes.data?.cci_corp_actions_coupons)

  const calendar: CorporateActionCalendarItem[] = [
    ...dividends.map((row) => ({
      id: `div-${row.basis_corp_action_id}`,
      title: row.company_name_full_ru ?? 'Дивиденды',
      date: (row.update_time ?? '').slice(0, 10) || '—',
      type: 'dividend' as const,
    })),
    ...coupons.map((row) => ({
      id: `cpn-${row.basis_corp_action_id}`,
      title: row.company_name_full_ru ?? 'Купон',
      date: (row.coupon_date ?? row.update_time ?? '').slice(0, 10) || '—',
      type: 'coupon' as const,
    })),
  ]

  return calendar.slice(0, limit)
}

export async function liveGetCompanyCorporateActions(companyIdValue: string): Promise<CompanyCorporateActionItem[]> {
  const { data } = await issClient.get('/cci/corp-actions/dividends.json', {
    params: { limit: 100 },
  })

  const rows = parseIssTable<MoexDividendRecord>(data?.cci_corp_actions_dividends)
  return rows
    .filter((row) => String(row.basis_company_id ?? '') === companyIdValue)
    .map((row) => ({
      id: String(row.basis_corp_action_id),
      title: row.corp_action_type_name ?? 'Корпоративное действие',
      date: (row.update_time ?? '').slice(0, 10) || '—',
      type: 'dividend',
    }))
}

export async function liveTryRequest(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  })
  const body = await response.text()
  const normalized = body.charCodeAt(0) === 0xfeff ? body.slice(1) : body
  try {
    return `HTTP ${response.status}\n\n${JSON.stringify(JSON.parse(normalized), null, 2).slice(0, 6000)}`
  } catch {
    return `HTTP ${response.status}\n\n${normalized.slice(0, 6000)}`
  }
}

function readReportValue(
  values: MoexMsfoReportValueRecord[],
  ...names: string[]
): number | undefined {
  for (const name of names) {
    const row = values.find((item) => item.parameter_name_short_ru?.toLowerCase() === name.toLowerCase())
    if (row?.value != null) return Number(row.value)
  }
  return undefined
}

function mapReportValuesToKpi(
  report: MoexMsfoReportRecord,
  values: MoexMsfoReportValueRecord[],
): CompanyKpiSnapshot {
  const revenue = readReportValue(values, 'Выручка')
  const operatingProfit = readReportValue(values, 'Операционная прибыль')
  const depreciation = readReportValue(values, 'Износ, истощение и амортизация')
  const netProfit = readReportValue(values, 'Чистая прибыль собственников', 'Чистая прибыль после налогообложения')
  const assets = readReportValue(values, 'АКТИВЫ')
  const equity = readReportValue(values, 'КАПИТАЛ')

  const ebitda = operatingProfit != null && depreciation != null
    ? operatingProfit + Math.abs(depreciation)
    : operatingProfit

  const roe = netProfit != null && equity != null && equity !== 0
    ? `${((netProfit / equity) * 100).toFixed(1)}%`
    : undefined

  const roa = netProfit != null && assets != null && assets !== 0
    ? Number(((netProfit / assets) * 100).toFixed(1))
    : undefined

  return {
    date: report.period_name_short_ru ?? report.period_code ?? '—',
    revenue,
    ebitda,
    netProfit,
    assets,
    equity,
    roe,
    roa,
  }
}

export async function liveGetCompanyReports(companyIdValue: string, limit = 8): Promise<CompanyReport[]> {
  const { data } = await issClient.get(`/cci/accounting/msfo-short/companies/${companyIdValue}/reports.json`, {
    params: { limit },
  })

  const rows = parseIssTable<MoexMsfoReportRecord>(data?.cci_reports)
  return rows.map((row) => ({
    id: String(row.basis_type_report_id),
    title: row.type_report_name_short_ru ?? 'МСФО краткая',
    period: row.period_name_short_ru ?? row.period_code ?? '—',
    publishedAt: (row.report_publicate_date ?? '').slice(0, 10) || '—',
    standard: 'IFRS' as const,
  }))
}

export async function liveGetCompanyKpiHistory(companyIdValue: string, limit = 6): Promise<CompanyKpiSnapshot[]> {
  const { data } = await issClient.get(`/cci/accounting/msfo-short/companies/${companyIdValue}/reports.json`, {
    params: { limit },
  })

  const reports = parseIssTable<MoexMsfoReportRecord>(data?.cci_reports)
  if (!reports.length) return []

  const snapshots = await Promise.all(
    reports.slice(0, limit).map(async (report) => {
      try {
        const response = await issClient.get(`/cci/accounting/msfo-short/reports/${report.basis_type_report_id}.json`)
        const values = parseIssTable<MoexMsfoReportValueRecord>(response.data?.cci_report_values)
        return mapReportValuesToKpi(report, values)
      } catch {
        return null
      }
    }),
  )

  return snapshots.filter((item): item is CompanyKpiSnapshot => item != null)
}

export { readMoexJson }
