/** Normalized financial statement lines (МСФО краткая, млн руб.). */
export interface FinancialLineItems {
  companyId: string
  reportId: string
  period: string
  publishedAt?: string
  standard?: 'IFRS' | 'RAS'

  revenue?: number
  cogs?: number
  grossProfit?: number
  operatingExpenses?: number
  depreciation?: number
  operatingProfit?: number
  ebitda?: number
  interestExpense?: number
  profitBeforeTax?: number
  netProfit?: number

  totalAssets?: number
  currentAssets?: number
  cash?: number
  receivables?: number
  inventory?: number
  fixedAssets?: number

  totalLiabilities?: number
  currentLiabilities?: number
  equity?: number
  shortTermDebt?: number
  longTermDebt?: number

  operatingCashFlow?: number
  investingCashFlow?: number
  financingCashFlow?: number

  sharesOutstanding?: number
  eps?: number
}

export type IndicatorFormat = 'percent' | 'ratio' | 'money' | 'number' | 'times'

export interface IndicatorDefinition {
  id: string
  name: string
  fullName: string
  formula: string
  description: string
  format: IndicatorFormat
  /** Keys from FinancialLineItems used in calculation (shown in tooltip). */
  inputs: Array<keyof FinancialLineItems>
  calculate: (lines: FinancialLineItems) => number | null
}

export interface CalculatedIndicatorValue {
  indicatorId: string
  value: number | null
  formatted: string
}

export interface CompanyIndicatorsResult {
  companyId: string
  companyName: string
  ticker: string
  period: string
  reportId: string
  source: 'live' | 'mock'
  lines: FinancialLineItems
  indicators: CalculatedIndicatorValue[]
}

export interface ComparisonIndicatorsResult {
  companies: CompanyIndicatorsResult[]
  calculatedAt: string
}
