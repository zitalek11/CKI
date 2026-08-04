export interface Company {
  id: string
  name: string
  ticker: string
  isin: string
  sector: string
  industry: string
  country: string
  status: 'listed' | 'delisted' | 'private'
  description?: string
  logoUrl?: string
  exchange?: string
}

export interface CompanyReport {
  id: string
  title: string
  period: string
  publishedAt: string
  standard?: 'IFRS' | 'RAS'
}

export interface CompanyKpiSnapshot {
  date: string
  price?: string
  marketCap?: string
  pe?: string
  roe?: string
  revenue?: number
  ebitda?: number
  netProfit?: number
  assets?: number
  equity?: number
  debt?: number
  roa?: number
  debtToEbitda?: number
  dividendYield?: number
  marginNet?: number
}

export interface CompanyProfile extends Company {
  snapshot?: CompanyKpiSnapshot
  reports?: CompanyReport[]
}
