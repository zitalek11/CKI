import { cciApiClient, issClient } from '../../nsd/client'
import { parseIssTable, readMoexJson } from '../issTable'
import {
  fetchAllIssTablePages,
  fetchAllNewApiPages,
  parseIssCursor,
  parseNewApiCursor,
} from '../pagination'
import type { PaginatedResult } from '../types'
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

export type CompaniesListParams = {
  q?: string
  sector?: string
  industry?: string
  limit?: number
  page?: number
  /** Load all pages from API (for sync/export). Safe cap: 200k rows. */
  fetchAll?: boolean
}

async function loadIndustryMap(): Promise<Map<number, string>> {
  if (industryCache.size > 0) return industryCache
  if (industryLoadPromise) return industryLoadPromise

  industryLoadPromise = fetchAllIssTablePages<MoexCompanyIndustryRecord>(
    issClient,
    '/cci/info/companies/industry-codes.json',
    'cci_company_industry',
    {},
    { pageSize: 1000 },
  ).then(({ items }) => {
    items.forEach((row) => {
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

function companyId(id: number | string) {
  return String(id)
}

function mapCompanyListItem(
  record: MoexCompanyRecord,
  industry?: string,
): CompanyListItem {
  const sector = industry ?? '—'
  return {
    id: companyId(record.basis_company_id),
    name: record.name_short_ru ?? record.name_full_ru ?? `Company ${record.basis_company_id}`,
    ticker: '—',
    isin: '—',
    sector,
    industry: sector,
    country: record.nation_name_short_ru ?? 'Россия',
  }
}

function applyClientFilters(
  items: CompanyListItem[],
  params?: CompaniesListParams,
): CompanyListItem[] {
  let filtered = items
  if (params?.sector) {
    const q = params.sector.toLowerCase()
    filtered = filtered.filter((item) => item.sector.toLowerCase().includes(q))
  }
  if (params?.industry) {
    const q = params.industry.toLowerCase()
    filtered = filtered.filter((item) => item.industry.toLowerCase().includes(q))
  }
  return filtered
}

async function fetchCompaniesNewApi(
  params: CompaniesListParams | undefined,
  industryMap: Map<number, string>,
): Promise<PaginatedResult<CompanyListItem>> {
  const page = params?.page ?? 1
  const limit = Math.max(params?.limit ?? 50, 10)

  if (params?.fetchAll) {
    const { items: records, pagination } = await fetchAllNewApiPages<MoexCompanyRecord>(
      cciApiClient,
      '/info/companies',
      { q: params.q || undefined },
    )
    const items = applyClientFilters(
      records.map((record) => mapCompanyListItem(record, industryMap.get(record.basis_company_id))),
      params,
    )
    return { items, pagination: { ...pagination, pageSize: items.length, page: 1 } }
  }

  const { data } = await cciApiClient.get<MoexNewApiListResponse<MoexCompanyRecord>>('/info/companies', {
    params: {
      page,
      limit,
      q: params?.q || undefined,
    },
  })

  const records = data.data ?? []
  let items = records.map((record) => mapCompanyListItem(record, industryMap.get(record.basis_company_id)))
  items = applyClientFilters(items, params)

  return {
    items,
    pagination: parseNewApiCursor(data.cursor, records.length),
  }
}

async function fetchCompaniesLegacyIss(
  params: CompaniesListParams | undefined,
  industryMap: Map<number, string>,
): Promise<PaginatedResult<CompanyListItem>> {
  const page = params?.page ?? 1
  const pageSize = Math.max(params?.limit ?? 100, 10)

  if (params?.fetchAll) {
    const { items: records, pagination } = await fetchAllIssTablePages<MoexCompanyRecord>(
      issClient,
      '/cci/info/companies.json',
      'cci_companies',
      { q: params.q || undefined },
    )
    const items = applyClientFilters(
      records.map((record) => mapCompanyListItem(record, industryMap.get(record.basis_company_id))),
      params,
    )
    return { items, pagination: { ...pagination, pageSize: items.length, page: 1 } }
  }

  const { data } = await issClient.get('/cci/info/companies.json', {
    params: {
      q: params?.q || undefined,
      limit: pageSize,
      start: (page - 1) * pageSize,
    },
  })

  const records = parseIssTable<MoexCompanyRecord>(data?.cci_companies)
  let items = records.map((record) => mapCompanyListItem(record, industryMap.get(record.basis_company_id)))
  items = applyClientFilters(items, params)

  const cursor = parseIssCursor(data?.['cci_companies.cursor'])
  return {
    items,
    pagination: cursor ?? parseNewApiCursor(undefined, records.length),
  }
}

export async function liveGetCompaniesList(
  params?: CompaniesListParams,
): Promise<PaginatedResult<CompanyListItem>> {
  const industryMap = await loadIndustryMap()

  try {
    return await fetchCompaniesNewApi(params, industryMap)
  } catch {
    return fetchCompaniesLegacyIss(params, industryMap)
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
    params: {
      limit: 1000,
      basis_company_id: companyIdValue,
    },
  })

  const rows = parseIssTable<MoexDividendRecord>(data?.cci_corp_actions_dividends)
  return rows.map((row) => ({
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
