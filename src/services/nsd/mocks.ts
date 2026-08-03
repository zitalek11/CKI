import type { Company } from '../../types/company'

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
    description: 'Крупнейшая газовая компания России. Данные представлены в mock режиме.',
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
    description: 'Крупнейший банк России. Данные представлены в mock режиме.',
    exchange: 'МосБиржа',
  },
]
