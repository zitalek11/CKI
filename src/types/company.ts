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

export interface CompanyKpiSnapshot {
  date: string
  revenue?: number
  ebitda?: number
  netProfit?: number
  assets?: number
  equity?: number
  debt?: number
  roe?: number
  roa?: number
  debtToEbitda?: number
  dividendYield?: number
  marginNet?: number
}
