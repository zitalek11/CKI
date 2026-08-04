import type { MoexMsfoReportValueRecord } from '../api/moexTypes'
import type { FinancialLineItems } from '../../types/financialIndicators'

type LineAlias = Exclude<keyof FinancialLineItems, 'companyId' | 'reportId' | 'period' | 'publishedAt' | 'standard'>

/** Maps MSFO parameter names (RU) to canonical financial line keys. */
const PARAMETER_ALIASES: Record<string, LineAlias> = {
  'Выручка': 'revenue',
  'Себестоимость реализации в т.ч.': 'cogs',
  'Операционные расходы, всего': 'operatingExpenses',
  'Износ, истощение и амортизация': 'depreciation',
  'Операционная прибыль': 'operatingProfit',
  'Процентные расходы': 'interestExpense',
  'Прибыль до налогообложения': 'profitBeforeTax',
  'Чистая прибыль собственников': 'netProfit',
  'Чистая прибыль после налогообложения': 'netProfit',
  'АКТИВЫ': 'totalAssets',
  'Оборотные (краткосрочные) активы': 'currentAssets',
  'Денежные средства и их эквиваленты': 'cash',
  'Дебиторская задолженность': 'receivables',
  'Запасы': 'inventory',
  'Основные средства': 'fixedAssets',
  'Всего обязательства': 'totalLiabilities',
  'Краткосрочные обязательства': 'currentLiabilities',
  'КАПИТАЛ': 'equity',
  'Краткосрочные кредиты и займы': 'shortTermDebt',
  'Долгосрочные кредиты и займы': 'longTermDebt',
  'Потоки денежных средств от операционной деятельности': 'operatingCashFlow',
  'Потоки денежных средств от инвестиционной деятельности': 'investingCashFlow',
  'Потоки денежных средств от финансовой деятельности': 'financingCashFlow',
  'Средневзвешенное количество обыкновенных акций в обращении': 'sharesOutstanding',
  'Прибыль на 1 акцию базовая': 'eps',
}

function assignLine(lines: FinancialLineItems, key: LineAlias, value: number) {
  switch (key) {
    case 'revenue': lines.revenue = value; break
    case 'cogs': lines.cogs = value; break
    case 'grossProfit': lines.grossProfit = value; break
    case 'operatingExpenses': lines.operatingExpenses = value; break
    case 'depreciation': lines.depreciation = value; break
    case 'operatingProfit': lines.operatingProfit = value; break
    case 'ebitda': lines.ebitda = value; break
    case 'interestExpense': lines.interestExpense = value; break
    case 'profitBeforeTax': lines.profitBeforeTax = value; break
    case 'netProfit': lines.netProfit = value; break
    case 'totalAssets': lines.totalAssets = value; break
    case 'currentAssets': lines.currentAssets = value; break
    case 'cash': lines.cash = value; break
    case 'receivables': lines.receivables = value; break
    case 'inventory': lines.inventory = value; break
    case 'fixedAssets': lines.fixedAssets = value; break
    case 'totalLiabilities': lines.totalLiabilities = value; break
    case 'currentLiabilities': lines.currentLiabilities = value; break
    case 'equity': lines.equity = value; break
    case 'shortTermDebt': lines.shortTermDebt = value; break
    case 'longTermDebt': lines.longTermDebt = value; break
    case 'operatingCashFlow': lines.operatingCashFlow = value; break
    case 'investingCashFlow': lines.investingCashFlow = value; break
    case 'financingCashFlow': lines.financingCashFlow = value; break
    case 'sharesOutstanding': lines.sharesOutstanding = value; break
    case 'eps': lines.eps = value; break
  }
}

export function parseMsfoReportValues(
  companyId: string,
  reportId: string,
  period: string,
  values: MoexMsfoReportValueRecord[],
  meta?: { publishedAt?: string },
): FinancialLineItems {
  const lines: FinancialLineItems = {
    companyId,
    reportId,
    period,
    publishedAt: meta?.publishedAt,
    standard: 'IFRS',
  }

  for (const row of values) {
    const name = row.parameter_name_short_ru?.trim()
    if (!name || row.value == null) continue
    const key = PARAMETER_ALIASES[name]
    if (!key) continue

    const numeric = Number(row.value)
    if (Number.isNaN(numeric)) continue

    const normalized = ['cogs', 'operatingExpenses', 'depreciation', 'interestExpense'].includes(key)
      ? Math.abs(numeric)
      : numeric
    assignLine(lines, key, normalized)
  }

  if (lines.revenue != null && lines.cogs != null) {
    lines.grossProfit = lines.revenue - lines.cogs
  }

  if (lines.operatingProfit != null && lines.depreciation != null) {
    lines.ebitda = lines.operatingProfit + lines.depreciation
  } else if (lines.operatingProfit != null) {
    lines.ebitda = lines.operatingProfit
  }

  if (lines.totalLiabilities == null && lines.currentLiabilities != null && lines.longTermDebt != null) {
    lines.totalLiabilities = lines.currentLiabilities + lines.longTermDebt
  }

  return lines
}

export function financialLinesFromSnapshot(
  companyId: string,
  period: string,
  snapshot: {
    revenue?: number
    ebitda?: number
    netProfit?: number
    assets?: number
    equity?: number
    debt?: number
  },
): FinancialLineItems {
  const cogs = snapshot.revenue != null ? snapshot.revenue * 0.62 : undefined
  const operatingProfit = snapshot.ebitda != null ? snapshot.ebitda * 0.88 : undefined
  const depreciation = snapshot.ebitda != null && operatingProfit != null
    ? snapshot.ebitda - operatingProfit
    : undefined

  return {
    companyId,
    reportId: `mock-${companyId}-${period}`,
    period,
    standard: 'IFRS',
    revenue: snapshot.revenue,
    cogs,
    grossProfit: snapshot.revenue != null && cogs != null ? snapshot.revenue - cogs : undefined,
    operatingProfit,
    depreciation,
    ebitda: snapshot.ebitda,
    netProfit: snapshot.netProfit,
    totalAssets: snapshot.assets ?? (snapshot.equity != null && snapshot.debt != null
      ? snapshot.equity + snapshot.debt
      : undefined),
    currentAssets: snapshot.assets != null ? snapshot.assets * 0.28 : undefined,
    cash: snapshot.assets != null ? snapshot.assets * 0.08 : undefined,
    inventory: snapshot.assets != null ? snapshot.assets * 0.05 : undefined,
    equity: snapshot.equity ?? (snapshot.netProfit != null ? snapshot.netProfit * 8 : undefined),
    totalLiabilities: snapshot.debt,
    currentLiabilities: snapshot.debt != null ? snapshot.debt * 0.45 : undefined,
    shortTermDebt: snapshot.debt != null ? snapshot.debt * 0.25 : undefined,
    longTermDebt: snapshot.debt != null ? snapshot.debt * 0.55 : undefined,
    interestExpense: operatingProfit != null ? operatingProfit * 0.08 : undefined,
    operatingCashFlow: snapshot.ebitda != null ? snapshot.ebitda * 0.75 : undefined,
    sharesOutstanding: 1_000_000_000,
    eps: snapshot.netProfit != null ? snapshot.netProfit / 1_000 : undefined,
  }
}

export function totalDebt(lines: FinancialLineItems): number | null {
  if (lines.shortTermDebt != null || lines.longTermDebt != null) {
    return (lines.shortTermDebt ?? 0) + (lines.longTermDebt ?? 0)
  }
  if (lines.totalLiabilities != null && lines.equity != null) {
    return Math.max(lines.totalLiabilities - lines.equity, 0)
  }
  return lines.totalLiabilities ?? null
}
