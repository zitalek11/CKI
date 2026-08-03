import type { CompanyKpiSnapshot } from './company'

export interface CompanyListItem {
  id: string
  name: string
  ticker: string
  isin: string
  sector: string
  industry: string
  country: string
}

export interface CompanyComparisonItem extends CompanyListItem {
  latestKpi?: CompanyKpiSnapshot
}
