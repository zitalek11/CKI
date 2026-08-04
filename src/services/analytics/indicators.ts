import type { FinancialLineItems, IndicatorDefinition } from '../../types/financialIndicators'
import { totalDebt } from './financialLines'

function ratio(numerator?: number | null, denominator?: number | null): number | null {
  if (numerator == null || denominator == null || denominator === 0) return null
  return numerator / denominator
}

function pct(numerator?: number | null, denominator?: number | null): number | null {
  const value = ratio(numerator, denominator)
  return value == null ? null : value * 100
}

/** 20 базовых финансовых индикаторов (CapIQ / Bloomberg style). */
export const BASIC_FINANCIAL_INDICATORS: IndicatorDefinition[] = [
  {
    id: 'roe',
    name: 'ROE',
    fullName: 'Рентабельность собственного капитала',
    formula: 'Чистая прибыль / Капитал × 100%',
    description: 'Показывает, сколько прибыли генерирует каждый рубль equity.',
    format: 'percent',
    inputs: ['netProfit', 'equity'],
    calculate: (l) => pct(l.netProfit, l.equity),
  },
  {
    id: 'roa',
    name: 'ROA',
    fullName: 'Рентабельность активов',
    formula: 'Чистая прибыль / Активы × 100%',
    description: 'Эффективность использования всех активов компании.',
    format: 'percent',
    inputs: ['netProfit', 'totalAssets'],
    calculate: (l) => pct(l.netProfit, l.totalAssets),
  },
  {
    id: 'gross_margin',
    name: 'Gross Margin',
    fullName: 'Валовая маржа',
    formula: '(Выручка − Себестоимость) / Выручка × 100%',
    description: 'Маржинальность основной деятельности до операционных расходов.',
    format: 'percent',
    inputs: ['revenue', 'cogs', 'grossProfit'],
    calculate: (l) => pct(l.grossProfit ?? (l.revenue != null && l.cogs != null ? l.revenue - l.cogs : null), l.revenue),
  },
  {
    id: 'ebitda_margin',
    name: 'EBITDA Margin',
    fullName: 'EBITDA-маржа',
    formula: 'EBITDA / Выручка × 100%',
    description: 'Операционная прибыльность до амортизации.',
    format: 'percent',
    inputs: ['ebitda', 'revenue'],
    calculate: (l) => pct(l.ebitda, l.revenue),
  },
  {
    id: 'operating_margin',
    name: 'Operating Margin',
    fullName: 'Операционная маржа',
    formula: 'Операционная прибыль / Выручка × 100%',
    description: 'Доля операционной прибыли в выручке.',
    format: 'percent',
    inputs: ['operatingProfit', 'revenue'],
    calculate: (l) => pct(l.operatingProfit, l.revenue),
  },
  {
    id: 'net_margin',
    name: 'Net Margin',
    fullName: 'Чистая маржа',
    formula: 'Чистая прибыль / Выручка × 100%',
    description: 'Итоговая рентабельность продаж.',
    format: 'percent',
    inputs: ['netProfit', 'revenue'],
    calculate: (l) => pct(l.netProfit, l.revenue),
  },
  {
    id: 'current_ratio',
    name: 'Current Ratio',
    fullName: 'Коэффициент текущей ликвидности',
    formula: 'Оборотные активы / Краткосрочные обязательства',
    description: 'Способность погашать краткосрочные обязательства.',
    format: 'ratio',
    inputs: ['currentAssets', 'currentLiabilities'],
    calculate: (l) => ratio(l.currentAssets, l.currentLiabilities),
  },
  {
    id: 'quick_ratio',
    name: 'Quick Ratio',
    fullName: 'Коэффициент быстрой ликвидности',
    formula: '(Оборотные активы − Запасы) / Краткосрочные обязательства',
    description: 'Ликвидность без учёта запасов.',
    format: 'ratio',
    inputs: ['currentAssets', 'inventory', 'currentLiabilities'],
    calculate: (l) => {
      if (l.currentAssets == null || l.currentLiabilities == null) return null
      return ratio(l.currentAssets - (l.inventory ?? 0), l.currentLiabilities)
    },
  },
  {
    id: 'cash_ratio',
    name: 'Cash Ratio',
    fullName: 'Cash Ratio',
    formula: 'Денежные средства / Краткосрочные обязательства',
    description: 'Максимально консервативная мера ликвидности.',
    format: 'ratio',
    inputs: ['cash', 'currentLiabilities'],
    calculate: (l) => ratio(l.cash, l.currentLiabilities),
  },
  {
    id: 'debt_equity',
    name: 'Debt / Equity',
    fullName: 'Debt-to-Equity',
    formula: 'Финансовый долг / Капитал',
    description: 'Уровень финансового рычага.',
    format: 'ratio',
    inputs: ['shortTermDebt', 'longTermDebt', 'equity'],
    calculate: (l) => ratio(totalDebt(l), l.equity),
  },
  {
    id: 'debt_assets',
    name: 'Debt / Assets',
    fullName: 'Debt-to-Assets',
    formula: 'Финансовый долг / Активы',
    description: 'Доля активов, профинансированная долгом.',
    format: 'percent',
    inputs: ['shortTermDebt', 'longTermDebt', 'totalAssets'],
    calculate: (l) => pct(totalDebt(l), l.totalAssets),
  },
  {
    id: 'net_debt_ebitda',
    name: 'Net Debt / EBITDA',
    fullName: 'Чистый долг / EBITDA',
    formula: '(Финансовый долг − Cash) / EBITDA',
    description: 'Классический leverage-мультипликатор.',
    format: 'times',
    inputs: ['shortTermDebt', 'longTermDebt', 'cash', 'ebitda'],
    calculate: (l) => {
      const debt = totalDebt(l)
      if (debt == null || l.ebitda == null || l.ebitda === 0) return null
      return (debt - (l.cash ?? 0)) / l.ebitda
    },
  },
  {
    id: 'interest_coverage',
    name: 'Interest Coverage',
    fullName: 'Покрытие процентов',
    formula: 'EBITDA / |Процентные расходы|',
    description: 'Сколько раз EBITDA покрывает процентные платежи.',
    format: 'times',
    inputs: ['ebitda', 'interestExpense'],
    calculate: (l) => {
      if (l.ebitda == null || l.interestExpense == null || l.interestExpense === 0) return null
      return l.ebitda / Math.abs(l.interestExpense)
    },
  },
  {
    id: 'asset_turnover',
    name: 'Asset Turnover',
    fullName: 'Оборачиваемость активов',
    formula: 'Выручка / Активы',
    description: 'Эффективность генерации выручки на единицу активов.',
    format: 'times',
    inputs: ['revenue', 'totalAssets'],
    calculate: (l) => ratio(l.revenue, l.totalAssets),
  },
  {
    id: 'equity_turnover',
    name: 'Equity Turnover',
    fullName: 'Оборачиваемость капитала',
    formula: 'Выручка / Капитал',
    description: 'Выручка на рубль собственного капитала.',
    format: 'times',
    inputs: ['revenue', 'equity'],
    calculate: (l) => ratio(l.revenue, l.equity),
  },
  {
    id: 'working_capital',
    name: 'Working Capital',
    fullName: 'Оборачиваемый капитал',
    formula: 'Оборотные активы − Краткосрочные обязательства',
    description: 'Запас ликвидности для текущей деятельности (млн руб.).',
    format: 'money',
    inputs: ['currentAssets', 'currentLiabilities'],
    calculate: (l) => {
      if (l.currentAssets == null || l.currentLiabilities == null) return null
      return l.currentAssets - l.currentLiabilities
    },
  },
  {
    id: 'ebitda',
    name: 'EBITDA',
    fullName: 'EBITDA',
    formula: 'Операционная прибыль + Амортизация',
    description: 'Операционный cash proxy (млн руб.).',
    format: 'money',
    inputs: ['operatingProfit', 'depreciation', 'ebitda'],
    calculate: (l) => l.ebitda ?? null,
  },
  {
    id: 'ocf_margin',
    name: 'OCF Margin',
    fullName: 'OCF Margin',
    formula: 'OCF / Выручка × 100%',
    description: 'Доля операционного денежного потока в выручке.',
    format: 'percent',
    inputs: ['operatingCashFlow', 'revenue'],
    calculate: (l) => pct(l.operatingCashFlow, l.revenue),
  },
  {
    id: 'eps',
    name: 'EPS',
    fullName: 'Earnings Per Share',
    formula: 'Чистая прибыль / Кол-во акций (или из отчётности)',
    description: 'Прибыль на акцию (руб.).',
    format: 'number',
    inputs: ['eps', 'netProfit', 'sharesOutstanding'],
    calculate: (l) => {
      if (l.eps != null) return l.eps
      if (l.netProfit == null || l.sharesOutstanding == null || l.sharesOutstanding === 0) return null
      return l.netProfit / l.sharesOutstanding * 1_000_000
    },
  },
  {
    id: 'roic',
    name: 'ROIC',
    fullName: 'Return on Invested Capital',
    formula: 'Операционная прибыль / (Капитал + Финансовый долг) × 100%',
    description: 'Доходность инвестированного капитала.',
    format: 'percent',
    inputs: ['operatingProfit', 'equity', 'shortTermDebt', 'longTermDebt'],
    calculate: (l) => {
      const debt = totalDebt(l)
      if (l.operatingProfit == null || l.equity == null || debt == null) return null
      const invested = l.equity + debt
      return pct(l.operatingProfit, invested)
    },
  },
]

export function calculateIndicators(lines: FinancialLineItems) {
  return BASIC_FINANCIAL_INDICATORS.map((definition) => {
    const raw = definition.calculate(lines)
    return {
      indicatorId: definition.id,
      value: raw,
      formatted: formatIndicatorValue(raw, definition.format),
    }
  })
}

export function formatIndicatorValue(value: number | null, format: IndicatorDefinition['format']): string {
  if (value == null || Number.isNaN(value) || !Number.isFinite(value)) return '—'

  switch (format) {
    case 'percent':
      return `${value.toFixed(1)}%`
    case 'ratio':
      return value.toFixed(2)
    case 'times':
      return `${value.toFixed(2)}x`
    case 'money':
      return `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value)} млн`
    case 'number':
      return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(value)
    default:
      return String(value)
  }
}

export function getIndicatorDefinition(id: string) {
  return BASIC_FINANCIAL_INDICATORS.find((item) => item.id === id)
}
