import { mockCompanies, mockCorporateActionsFeed, mockCorporateActionsCalendar } from './mocks'

export interface DashboardStat {
  label: string
  value: string
}

export interface DashboardSectorPoint {
  label: string
  issuers: number
  [key: string]: string | number | undefined
}

export interface DashboardTimelinePoint {
  label: string
  dividends: number
  coupons: number
  meetings: number
  [key: string]: string | number | undefined
}

const sectorCounts = mockCompanies.reduce<Record<string, number>>((acc, company) => {
  acc[company.sector] = (acc[company.sector] ?? 0) + 1
  return acc
}, {})

export async function nsdGetDashboardStats(): Promise<DashboardStat[]> {
  return [
    { label: 'Эмитенты в базе', value: String(mockCompanies.length) },
    { label: 'Новые отчёты', value: '9' },
    { label: 'Предстоящие дивиденды', value: String(mockCorporateActionsCalendar.filter((item) => item.type === 'dividend').length) },
    { label: 'Купоны на месяц', value: String(mockCorporateActionsCalendar.filter((item) => item.type === 'coupon').length) },
  ]
}

export async function nsdGetDashboardSectorDistribution(): Promise<DashboardSectorPoint[]> {
  return Object.entries(sectorCounts).map(([label, issuers]) => ({ label, issuers }))
}

export async function nsdGetDashboardTimeline(): Promise<DashboardTimelinePoint[]> {
  return [
    { label: 'Авг', dividends: 4, coupons: 6, meetings: 2 },
    { label: 'Сен', dividends: 7, coupons: 5, meetings: 3 },
    { label: 'Окт', dividends: 5, coupons: 8, meetings: 4 },
    { label: 'Ноя', dividends: 9, coupons: 4, meetings: 2 },
    { label: 'Дек', dividends: 12, coupons: 7, meetings: 5 },
  ]
}

export async function nsdGetDashboardFeed() {
  return mockCorporateActionsFeed.slice(0, 5)
}

export async function nsdGetDashboardDisclosures() {
  return [
    'Газпром — отчётность IFRS Q3 2025',
    'Сбербанк — раскрытие по дивидендам',
    'ЛУКОЙЛ — корпоративное сообщение',
    'Роснефть — публикация МСФО',
    'НОВАТЭК — операционные результаты',
  ]
}
