import type { Company, CompanyProfile, CompanyKpiSnapshot } from '../../types/company'
import type {
  CompanyCorporateActionItem,
  CorporateActionCalendarItem,
  CorporateActionFeedItem,
} from '../../types/corporateAction'

export const mockCompanies: Company[] = [
  {
    id: 'MOEX_GAZP',
    name: 'ПАО «Газпром»',
    ticker: 'GAZP',
    isin: 'RU0007661625',
    sector: 'Нефть и газ',
    industry: 'Газ',
    country: 'Россия',
    status: 'listed',
    description: 'Крупнейшая газовая компания России.',
    exchange: 'МосБиржа',
  },
  {
    id: 'MOEX_SBER',
    name: 'ПАО «Сбербанк России»',
    ticker: 'SBER',
    isin: 'RU0009029540',
    sector: 'Финансовый сектор',
    industry: 'Банки',
    country: 'Россия',
    status: 'listed',
    description: 'Крупнейший банк России.',
    exchange: 'МосБиржа',
  },
  {
    id: 'MOEX_LKOH',
    name: 'ПАО «ЛУКОЙЛ»',
    ticker: 'LKOH',
    isin: 'RU0009024277',
    sector: 'Нефть и газ',
    industry: 'Нефть',
    country: 'Россия',
    status: 'listed',
    description: 'Вертикально интегрированная нефтяная компания.',
    exchange: 'МосБиржа',
  },
  {
    id: 'MOEX_ROSN',
    name: 'ПАО «НК «Роснефть»',
    ticker: 'ROSN',
    isin: 'RU000A0J2Q06',
    sector: 'Нефть и газ',
    industry: 'Нефть',
    country: 'Россия',
    status: 'listed',
    description: 'Крупнейшая нефтяная компания России.',
    exchange: 'МосБиржа',
  },
  {
    id: 'MOEX_NLMK',
    name: 'ПАО «НЛМК»',
    ticker: 'NLMK',
    isin: 'RU0009046518',
    sector: 'Металлы',
    industry: 'Сталь',
    country: 'Россия',
    status: 'listed',
    description: 'Один из крупнейших производителей стали в России.',
    exchange: 'МосБиржа',
  },
  {
    id: 'MOEX_VTBR',
    name: 'ПАО «Банк ВТБ»',
    ticker: 'VTBR',
    isin: 'RU000A0JP5V6',
    sector: 'Финансовый сектор',
    industry: 'Банки',
    country: 'Россия',
    status: 'listed',
    description: 'Второй по масштабу банк России.',
    exchange: 'МосБиржа',
  },
  {
    id: 'MOEX_NVTK',
    name: 'ПАО «НОВАТЭК»',
    ticker: 'NVTK',
    isin: 'RU000A0DKVS5',
    sector: 'Нефть и газ',
    industry: 'Газ',
    country: 'Россия',
    status: 'listed',
    description: 'Независимый производитель природного газа.',
    exchange: 'МосБиржа',
  },
  {
    id: 'MOEX_MTSS',
    name: 'ПАО «МТС»',
    ticker: 'MTSS',
    isin: 'RU0007775219',
    sector: 'Телеком',
    industry: 'Связь',
    country: 'Россия',
    status: 'listed',
    description: 'Крупнейший оператор мобильной связи в России.',
    exchange: 'МосБиржа',
  },
]

const baseKpis: Record<string, CompanyKpiSnapshot[]> = {
  MOEX_GAZP: [
    { date: '2024-Q4', price: '148,2 ₽', marketCap: '3,5 трлн ₽', pe: '3,8', roe: '11,2%', revenue: 7_980_000, ebitda: 2_010_000, netProfit: 960_000, assets: 16_200_000, equity: 8_570_000, debt: 4_120_000 },
    { date: '2025-Q1', price: '152,8 ₽', marketCap: '3,6 трлн ₽', pe: '3,9', roe: '11,5%', revenue: 8_020_000, ebitda: 2_040_000, netProfit: 970_000 },
    { date: '2025-Q2', price: '158,1 ₽', marketCap: '3,7 трлн ₽', pe: '4,0', roe: '11,8%', revenue: 8_100_000, ebitda: 2_050_000, netProfit: 980_000 },
    { date: '2025-Q3', price: '162,4 ₽', marketCap: '3,8 трлн ₽', pe: '4,2', roe: '12,4%', revenue: 8_420_000, ebitda: 2_180_000, netProfit: 1_020_000 },
  ],
  MOEX_SBER: [
    { date: '2024-Q4', price: '265,4 ₽', marketCap: '5,9 трлн ₽', pe: '4,7', roe: '20,8%', revenue: 2_720_000, ebitda: 1_310_000, netProfit: 1_060_000, assets: 52_400_000, equity: 5_100_000, debt: 41_200_000 },
    { date: '2025-Q1', price: '271,0 ₽', marketCap: '6,0 трлн ₽', pe: '4,8', roe: '21,2%', revenue: 2_760_000, ebitda: 1_330_000, netProfit: 1_080_000 },
    { date: '2025-Q2', price: '278,2 ₽', marketCap: '6,2 трлн ₽', pe: '4,9', roe: '21,9%', revenue: 2_810_000, ebitda: 1_360_000, netProfit: 1_120_000 },
    { date: '2025-Q3', price: '285,6 ₽', marketCap: '6,4 трлн ₽', pe: '5,1', roe: '22,8%', revenue: 2_940_000, ebitda: 1_420_000, netProfit: 1_180_000 },
  ],
  MOEX_LKOH: [
    { date: '2025-Q3', price: '7 420 ₽', marketCap: '5,1 трлн ₽', pe: '3,8', roe: '18,2%', revenue: 2_180_000, ebitda: 620_000, netProfit: 410_000, assets: 5_474_421, equity: 3_626_453, debt: 1_847_968 },
  ],
  MOEX_ROSN: [
    { date: '2025-Q3', price: '512 ₽', marketCap: '5,4 трлн ₽', pe: '4,5', roe: '15,6%', revenue: 3_120_000, ebitda: 890_000, netProfit: 520_000, assets: 12_800_000, equity: 3_330_000, debt: 6_450_000 },
  ],
  MOEX_NLMK: [
    { date: '2025-Q3', price: '142 ₽', marketCap: '850 млрд ₽', pe: '5,8', roe: '19,4%', revenue: 680_000, ebitda: 142_000, netProfit: 88_000, assets: 1_420_000, equity: 454_000, debt: 620_000 },
  ],
  MOEX_VTBR: [
    { date: '2025-Q3', price: '98,4 ₽', marketCap: '1,9 трлн ₽', pe: '3,2', roe: '17,1%', revenue: 980_000, ebitda: 420_000, netProfit: 310_000, assets: 18_600_000, equity: 1_810_000, debt: 14_900_000 },
  ],
  MOEX_NVTK: [
    { date: '2025-Q3', price: '1 240 ₽', marketCap: '3,7 трлн ₽', pe: '6,1', roe: '24,3%', revenue: 1_420_000, ebitda: 780_000, netProfit: 540_000 },
  ],
  MOEX_MTSS: [
    { date: '2025-Q3', price: '268 ₽', marketCap: '540 млрд ₽', pe: '8,4', roe: '28,6%', revenue: 420_000, ebitda: 180_000, netProfit: 92_000 },
  ],
}

export const mockCompanyKpis: Record<string, CompanyKpiSnapshot[]> = baseKpis

export const mockCompanyProfiles: Record<string, CompanyProfile> = Object.fromEntries(
  mockCompanies.map((company) => {
    const snapshot = baseKpis[company.id]?.[0]
    return [
      company.id,
      {
        ...company,
        snapshot,
        reports: [
          {
            id: `${company.id}-ifrs-q3`,
            title: `Консолидированная отчётность IFRS`,
            period: 'Q3 2025',
            publishedAt: '2025-11-15',
            standard: 'IFRS',
          },
          {
            id: `${company.id}-ras-q3`,
            title: `Бухгалтерская отчётность РСБУ`,
            period: 'Q3 2025',
            publishedAt: '2025-11-10',
            standard: 'RAS',
          },
        ],
      } satisfies CompanyProfile,
    ]
  }),
)

export const mockCompanyActions: Record<string, CompanyCorporateActionItem[]> = {
  MOEX_GAZP: [
    { id: 'gazp-1', title: 'Рекомендация по дивидендам за 9M 2025', date: '2025-12-18', type: 'dividend' },
    { id: 'gazp-2', title: 'Годовое общее собрание акционеров', date: '2026-06-28', type: 'meeting' },
    { id: 'gazp-3', title: 'Раскрытие отчётности IFRS Q3', date: '2025-11-15', type: 'disclosure' },
  ],
  MOEX_SBER: [
    { id: 'sber-1', title: 'Выплата дивидендов за 2024', date: '2025-07-11', type: 'dividend' },
    { id: 'sber-2', title: 'Публикация отчётности IFRS Q3', date: '2025-11-08', type: 'disclosure' },
    { id: 'sber-3', title: 'Обновление кредитного рейтинга', date: '2025-10-22', type: 'ratingReview' },
  ],
  MOEX_LKOH: [
    { id: 'lkoh-1', title: 'Промежуточные дивиденды', date: '2025-12-05', type: 'dividend' },
    { id: 'lkoh-2', title: 'Buyback программа — этап II', date: '2025-09-30', type: 'buyback' },
  ],
  MOEX_ROSN: [
    { id: 'rosn-1', title: 'Купонный платёж по облигациям', date: '2025-12-12', type: 'coupon' },
    { id: 'rosn-2', title: 'Публикация МСФО отчётности', date: '2025-11-20', type: 'disclosure' },
  ],
}

export const mockCorporateActionsFeed: CorporateActionFeedItem[] = [
  { id: 'feed-1', title: 'Газпром — рекомендация по дивидендам', date: '2025-12-18', sector: 'Нефть и газ', type: 'dividend' },
  { id: 'feed-2', title: 'Сбербанк — обновление рейтинга ACRA', date: '2025-10-22', sector: 'Финансовый сектор', type: 'ratingReview' },
  { id: 'feed-3', title: 'ЛУКОЙЛ — промежуточные дивиденды', date: '2025-12-05', sector: 'Нефть и газ', type: 'dividend' },
  { id: 'feed-4', title: 'НЛМК — buyback программа', date: '2025-11-28', sector: 'Металлы', type: 'buyback' },
  { id: 'feed-5', title: 'Роснефть — купонный платёж', date: '2025-12-12', sector: 'Нефть и газ', type: 'coupon' },
  { id: 'feed-6', title: 'МТС — годовое собрание акционеров', date: '2026-05-14', sector: 'Телеком', type: 'meeting' },
]

export const mockCorporateActionsCalendar: CorporateActionCalendarItem[] = [
  { id: 'cal-1', title: 'Газпром — дивиденды', date: '2025-12-18', type: 'dividend' },
  { id: 'cal-2', title: 'ЛУКОЙЛ — дивиденды', date: '2025-12-05', type: 'dividend' },
  { id: 'cal-3', title: 'Роснефть — купоны', date: '2025-12-12', type: 'coupon' },
  { id: 'cal-4', title: 'ВТБ — публикация отчётности', date: '2025-12-20', type: 'issue' },
  { id: 'cal-5', title: 'НОВАТЭК — собрание акционеров', date: '2026-01-15', type: 'meeting' },
  { id: 'cal-6', title: 'Сбербанк — review рейтинга', date: '2026-01-22', type: 'ratingReview' },
]
