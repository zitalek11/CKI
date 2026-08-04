export const CCI_DOCS_URL = 'https://iss.moex.com/iss/apps/nsd_corp_info/v1/docs#'
export const CCI_DOCS_LEGACY = 'https://iss.moex.com/iss/docs/corpinfo/v1/'
export const CCI_ISS_BASE_URL = 'https://iss.moex.com/iss'
export const CCI_NEW_API_BASE_URL = 'https://iss.moex.com/iss/apps/nsd_corp_info/v1'
export const MOEX_PASSPORT_AUTH_URL = 'https://passport.moex.com/authenticate'

export type ApiEndpointCategory =
  | 'reference'
  | 'companies'
  | 'securities'
  | 'accounting'
  | 'ratings'
  | 'corp-actions'
  | 'reporting'
  | 'calendar'

export interface ApiEndpointParam {
  name: string
  in: 'query' | 'path'
  required?: boolean
  description: string
  example?: string
}

export interface ApiEndpointDefinition {
  id: string
  category: ApiEndpointCategory
  name: string
  method: 'GET'
  legacyPath: string
  newApiPath: string
  description: string
  params: ApiEndpointParam[]
  responseObjects: string[]
  exampleResponse: string
  docsPath?: string
}

export const API_ENDPOINT_CATEGORIES: Record<ApiEndpointCategory, string> = {
  reference: 'Справочники',
  companies: 'Компании',
  securities: 'Выпуски ЦБ',
  accounting: 'Финансовая отчётность',
  ratings: 'Рейтинги',
  'corp-actions': 'Корпоративные действия',
  reporting: 'Раскрытия и отчётность',
  calendar: 'Календарь',
}

export const ckiApiEndpoints: ApiEndpointDefinition[] = [
  {
    id: 'ref-periods',
    category: 'reference',
    name: 'Справочник периодов',
    method: 'GET',
    legacyPath: '/iss/cci/reference/periods',
    newApiPath: '/reference/periods',
    description: 'Справочная информация по периодам публикации отчётности (кварталы, месяцы).',
    params: [
      { name: 'page', in: 'query', description: 'Номер страницы (новый API)', example: '1' },
      { name: 'limit', in: 'query', description: 'Размер страницы, max 1000', example: '100' },
      { name: 'start', in: 'query', description: 'Смещение (legacy ISS API)', example: '0' },
    ],
    responseObjects: ['periods', 'periods.cursor'],
    exampleResponse: `{
  "periods": {
    "columns": ["period_id", "period_name_ru", "update_time"],
    "data": [
      ["2025-Q3", "III квартал 2025", "2025-08-19T13:21:59"]
    ]
  }
}`,
  },
  {
    id: 'ref-industry-codes',
    category: 'reference',
    name: 'Отраслевая классификация',
    method: 'GET',
    legacyPath: '/iss/cci/reference/industry-codes',
    newApiPath: '/reference/industry-codes',
    description: 'Справочник отраслевых кодов для секторной аналитики и фильтрации.',
    params: [],
    responseObjects: ['industry-codes'],
    exampleResponse: `{
  "industry-codes": {
    "columns": ["industry_code_id", "industry_name_ru"],
    "data": [[101, "Нефть и газ"]]
  }
}`,
  },
  {
    id: 'ref-guides-treks',
    category: 'reference',
    name: 'Типы и категории справочников',
    method: 'GET',
    legacyPath: '/iss/cci/reference/guides-treks',
    newApiPath: '/reference/guides-treks',
    description: 'Метаданные по типам справочных данных и категориям показателей.',
    params: [
      { name: 'guide_id', in: 'query', description: 'Фильтр по идентификатору типа справочника' },
      { name: 'trek_id', in: 'query', description: 'Фильтр по идентификатору категории' },
    ],
    responseObjects: ['guides', 'treks'],
    exampleResponse: `{
  "guides": { "columns": ["guide_id", "guide_name_ru"], "data": [[1, "Показатели отчётности"]] },
  "treks": { "columns": ["trek_id", "trek_name_ru"], "data": [[2283, "ROE"]] }
}`,
  },
  {
    id: 'info-companies',
    category: 'companies',
    name: 'Справочник организаций',
    method: 'GET',
    legacyPath: '/iss/cci/info/companies',
    newApiPath: '/info/companies',
    description: 'Список эмитентов с поиском по названию, ИНН и фильтром по дате обновления.',
    params: [
      { name: 'q', in: 'query', description: 'Поиск по части названия или началу ИНН', example: 'ЛУКОЙЛ' },
      { name: 'updated_after', in: 'query', description: 'Фильтр по дате обновления (legacy)', example: '2025-01-01-00:00:00' },
      { name: 'page', in: 'query', description: 'Номер страницы (новый API)', example: '1' },
      { name: 'limit', in: 'query', description: 'Размер страницы', example: '100' },
    ],
    responseObjects: ['cci_companies', 'cci_companies.cursor'],
    exampleResponse: `{
  "cci_companies": {
    "columns": ["basis_company_id", "name_short_ru", "inn", "ogrn", "update_time"],
    "data": [
      [690, "ПАО \\"ЛУКОЙЛ\\"", "7708004767", "1027700035769", "2025-08-19T13:21:59"]
    ]
  },
  "cci_companies.cursor": {
    "columns": ["INDEX", "TOTAL", "PAGESIZE"],
    "data": [[0, 2, 100]]
  }
}`,
  },
  {
    id: 'info-company-one',
    category: 'companies',
    name: 'Карточка организации',
    method: 'GET',
    legacyPath: '/iss/cci/info/companies/{company}',
    newApiPath: '/info/companies/{company}',
    description: 'Полная справочная информация по конкретной организации.',
    params: [
      { name: 'company', in: 'path', required: true, description: 'basis_company_id из справочника компаний', example: '690' },
    ],
    responseObjects: ['cci_company'],
    exampleResponse: `{
  "cci_company": {
    "columns": ["basis_company_id", "name_short_ru", "inn", "ogrn", "update_time"],
    "data": [[690, "ПАО \\"ЛУКОЙЛ\\"", "7708004767", "1027700035769", "2025-08-19T13:21:59"]]
  }
}`,
  },
  {
    id: 'info-companies-industry',
    category: 'companies',
    name: 'Отраслевая классификация компаний',
    method: 'GET',
    legacyPath: '/iss/cci/info/companies/industry-codes',
    newApiPath: '/info/companies/industry-codes',
    description: 'Сопоставление компаний с отраслевыми кодами.',
    params: [
      { name: 'page', in: 'query', description: 'Номер страницы', example: '1' },
      { name: 'limit', in: 'query', description: 'Размер страницы', example: '100' },
    ],
    responseObjects: ['cci_company_industry', 'cci_company_industry.cursor'],
    exampleResponse: `{
  "cci_company_industry": {
    "columns": ["basis_company_id", "company_name_short_ru", "industry_code_id"],
    "data": [[690, "ПАО \\"ЛУКОЙЛ\\"", 101]]
  }
}`,
  },
  {
    id: 'info-securities',
    category: 'securities',
    name: 'Справочник выпусков ЦБ',
    method: 'GET',
    legacyPath: '/iss/cci/info-nsd/securities',
    newApiPath: '/info-nsd/securities',
    description: 'Справочные данные по выпускам: ISIN, регистрационный номер, эмитент.',
    params: [
      { name: 'isin', in: 'query', description: 'Список ISIN', example: 'RU0009024277' },
      { name: 'basis_company_id', in: 'query', description: 'Фильтр по эмитенту' },
      { name: 'q', in: 'query', description: 'Поиск по части названия или идентификатору' },
    ],
    responseObjects: ['cci_securities_all', 'cci_securities_all.cursor'],
    exampleResponse: `{
  "cci_securities_all": {
    "columns": ["basis_security_id", "isin", "basis_company_id", "security_name_short_ru"],
    "data": [[12045, "RU0009024277", 690, "ПАО \\"ЛУКОЙЛ\\" ао"]]
  }
}`,
  },
  {
    id: 'info-securitybooks',
    category: 'securities',
    name: 'Типы выпусков',
    method: 'GET',
    legacyPath: '/iss/cci/info-nsd/securitybooks',
    newApiPath: '/info-nsd/securitybooks',
    description: 'Справочник типов выпусков (акции, облигации и др.).',
    params: [],
    responseObjects: ['cci_securities_index'],
    exampleResponse: `{
  "cci_securities_index": {
    "columns": ["securitybook_id", "securitybook_name_ru"],
    "data": [[1, "Акции"], [2, "Облигации"]]
  }
}`,
  },
  {
    id: 'accounting-msfo-short-reports',
    category: 'accounting',
    name: 'МСФО краткая — список отчётов',
    method: 'GET',
    legacyPath: '/iss/cci/accounting/msfo-short/companies/{company}/reports',
    newApiPath: '/accounting/msfo-short/companies/{company}/reports',
    description: 'Список кратких отчётов МСФО по компании.',
    params: [
      { name: 'company', in: 'path', required: true, description: 'basis_company_id', example: '690' },
      { name: 'page', in: 'query', description: 'Номер страницы', example: '1' },
      { name: 'limit', in: 'query', description: 'Размер страницы', example: '100' },
    ],
    responseObjects: ['cci_company', 'cci_reports', 'cci_reports.cursor'],
    exampleResponse: `{
  "cci_company": { "columns": ["basis_company_id", "name_short_ru"], "data": [[690, "ПАО \\"ЛУКОЙЛ\\""]] },
  "cci_reports": {
    "columns": ["basis_type_report_id", "period_id", "publication_date"],
    "data": [[10231, "2025-Q2", "2025-08-15T18:10:20"]]
  }
}`,
  },
  {
    id: 'accounting-msfo-short-report',
    category: 'accounting',
    name: 'МСФО краткая — отчёт',
    method: 'GET',
    legacyPath: '/iss/cci/accounting/msfo-short/reports/{report_id}',
    newApiPath: '/accounting/msfo-short/reports/{report_id}',
    description: 'Детальные значения показателей конкретного краткого отчёта МСФО.',
    params: [
      { name: 'report_id', in: 'path', required: true, description: 'basis_type_report_id', example: '10231' },
    ],
    responseObjects: ['cci_company', 'cci_report', 'cci_report_values'],
    exampleResponse: `{
  "cci_report_values": {
    "columns": ["parameter_trek_id", "parameter_name_ru", "value", "update_time"],
    "data": [[2283, "ROE", 0.17023, "2025-07-16T20:35:40"]]
  }
}`,
  },
  {
    id: 'accounting-msfo-full-reports',
    category: 'accounting',
    name: 'МСФО полная — список отчётов',
    method: 'GET',
    legacyPath: '/iss/cci/accounting/msfo-full/companies/{company}/reports',
    newApiPath: '/accounting/msfo-full/companies/{company}/reports',
    description: 'Список полных отчётов МСФО по компании.',
    params: [
      { name: 'company', in: 'path', required: true, description: 'basis_company_id', example: '690' },
    ],
    responseObjects: ['cci_company', 'cci_reports', 'cci_reports.cursor'],
    exampleResponse: `{
  "cci_reports": {
    "columns": ["basis_type_report_id", "period_id", "publication_date"],
    "data": [[20451, "2025-Q2", "2025-08-20T12:00:00"]]
  }
}`,
  },
  {
    id: 'accounting-msfo-full-indicators',
    category: 'accounting',
    name: 'МСФО — индикаторы компании',
    method: 'GET',
    legacyPath: '/iss/cci/accounting/msfo-full/companies/{company}/indicators',
    newApiPath: '/accounting/msfo-full/companies/{company}/indicators',
    description: 'Финансовые индикаторы МСФО по организации для аналитики и сравнения.',
    params: [
      { name: 'company', in: 'path', required: true, description: 'basis_company_id', example: '690' },
      { name: 'period', in: 'query', description: 'Период отчётности', example: '2025-Q2' },
    ],
    responseObjects: ['cci_msfo_indicator', 'cci_msfo_indicator.cursor'],
    exampleResponse: `{
  "cci_msfo_indicator": {
    "columns": ["basis_type_report_id", "parameter_trek_id", "value", "update_time"],
    "data": [[19976, 2283, 0.17023, "2025-07-16T20:35:40"]]
  }
}`,
  },
  {
    id: 'accounting-msfo-industry-benchmarks',
    category: 'accounting',
    name: 'МСФО — отраслевые бенчмарки',
    method: 'GET',
    legacyPath: '/iss/cci/accounting/msfo-full/industry-indicators/reports',
    newApiPath: '/accounting/msfo-full/industry-indicators/reports',
    description: 'Средние значения индикаторов МСФО по отраслевой классификации.',
    params: [
      { name: 'period', in: 'query', description: 'Период', example: '2025-Q2' },
    ],
    responseObjects: ['cci_benchmarks', 'cci_benchmarks.cursor'],
    exampleResponse: `{
  "cci_benchmarks": {
    "columns": ["indicator_id", "industry_code_id", "avg_value"],
    "data": [[501, 101, 0.142]]
  }
}`,
  },
  {
    id: 'accounting-rsbu-reports',
    category: 'accounting',
    name: 'РСБУ — список отчётов',
    method: 'GET',
    legacyPath: '/iss/cci/accounting/rsbu/companies/{company}/reports',
    newApiPath: '/accounting/rsbu/companies/{company}/reports',
    description: 'Список отчётности РСБУ по компании.',
    params: [
      { name: 'company', in: 'path', required: true, description: 'basis_company_id', example: '690' },
    ],
    responseObjects: ['cci_company', 'cci_reports', 'cci_reports.cursor'],
    exampleResponse: `{
  "cci_reports": {
    "columns": ["basis_type_report_id", "period_id", "publication_date"],
    "data": [[8801, "2025-Q2", "2025-08-10T09:00:00"]]
  }
}`,
  },
  {
    id: 'rating-companies',
    category: 'ratings',
    name: 'Рейтинги организаций',
    method: 'GET',
    legacyPath: '/iss/cci/rating/companies',
    newApiPath: '/rating/companies',
    description: 'Текущие рейтинги компаний без агрегации.',
    params: [
      { name: 'agency_id', in: 'query', description: 'Идентификатор рейтингового агентства' },
      { name: 'page', in: 'query', description: 'Номер страницы', example: '1' },
      { name: 'limit', in: 'query', description: 'Размер страницы', example: '100' },
    ],
    responseObjects: ['rating_companies', 'rating_companies.cursor'],
    exampleResponse: `{
  "rating_companies": {
    "columns": ["basis_company_id", "company_name_short_ru", "rating_book_name_short_ru", "update_time"],
    "data": [[1205, "ПАО \\"ММК\\"", "Национальная шкала...", "2025-09-11T12:00:06"]]
  }
}`,
  },
  {
    id: 'rating-company-history',
    category: 'ratings',
    name: 'История рейтингов компании',
    method: 'GET',
    legacyPath: '/iss/cci/rating/history/companies/{company_id}',
    newApiPath: '/rating/history/companies/{company_id}',
    description: 'Архив изменений рейтингов по организации.',
    params: [
      { name: 'company_id', in: 'path', required: true, description: 'basis_company_id', example: '1205' },
    ],
    responseObjects: ['rating_history_companies', 'rating_history_companies.cursor'],
    exampleResponse: `{
  "rating_history_companies": {
    "columns": ["basis_company_id", "rating_level_name_ru", "rating_action_trek_id", "update_time"],
    "data": [[1205, "BBB+", 696, "2025-06-17T16:00:03"]]
  }
}`,
  },
  {
    id: 'rating-agg-companies',
    category: 'ratings',
    name: 'Агрегированные рейтинги компаний',
    method: 'GET',
    legacyPath: '/iss/cci/rating/agg/companies',
    newApiPath: '/rating/agg/companies',
    description: 'Актуальные агрегированные рейтинги по компаниям.',
    params: [
      { name: 'source_id', in: 'query', description: 'Идентификатор источника/агентства' },
    ],
    responseObjects: ['cci_rating_history_companies_ag', 'cci_rating_history_companies_ag.cursor'],
    exampleResponse: `{
  "cci_rating_history_companies_ag": {
    "columns": ["basis_company_id", "agg_rating_value", "update_time"],
    "data": [[1205, "BBB+", "2025-09-11T12:00:06"]]
  }
}`,
  },
  {
    id: 'rating-securities',
    category: 'ratings',
    name: 'Рейтинги выпусков',
    method: 'GET',
    legacyPath: '/iss/cci/rating/securities',
    newApiPath: '/rating/securities',
    description: 'Текущие рейтинги выпусков ценных бумаг.',
    params: [
      { name: 'isin', in: 'query', description: 'Фильтр по ISIN', example: 'RU0009024277' },
    ],
    responseObjects: ['cci_rating_securities', 'cci_rating_securities.cursor'],
    exampleResponse: `{
  "cci_rating_securities": {
    "columns": ["basis_security_id", "isin", "rating_level_name_ru"],
    "data": [[12045, "RU0009024277", "ruAAA"]]
  }
}`,
  },
  {
    id: 'corp-actions-all',
    category: 'corp-actions',
    name: 'Корпоративные действия',
    method: 'GET',
    legacyPath: '/iss/cci/corp-actions',
    newApiPath: '/corp-actions',
    description: 'Общий реестр корпоративных действий по эмитентам.',
    params: [
      { name: 'basis_company_id', in: 'query', description: 'Фильтр по эмитенту' },
      { name: 'page', in: 'query', description: 'Номер страницы', example: '1' },
      { name: 'limit', in: 'query', description: 'Размер страницы', example: '100' },
    ],
    responseObjects: ['cci_corp_actions', 'cci_corp_actions.cursor'],
    exampleResponse: `{
  "cci_corp_actions": {
    "columns": ["corp_action_id", "basis_company_id", "action_type_name_ru", "record_date"],
    "data": [[5012, 690, "Дивиденды", "2025-12-18T00:00:00"]]
  }
}`,
  },
  {
    id: 'corp-actions-dividends',
    category: 'corp-actions',
    name: 'Дивиденды',
    method: 'GET',
    legacyPath: '/iss/cci/corp-actions/dividends',
    newApiPath: '/corp-actions/dividends',
    description: 'Корпоративные действия по дивидендам.',
    params: [
      { name: 'basis_company_id', in: 'query', description: 'Фильтр по эмитенту' },
    ],
    responseObjects: ['cci_corp_actions_dividends', 'cci_corp_actions_dividends.cursor'],
    exampleResponse: `{
  "cci_corp_actions_dividends": {
    "columns": ["corp_action_id", "basis_company_id", "record_date", "amount"],
    "data": [[5012, 690, "2025-12-18T00:00:00", 16.61]]
  }
}`,
  },
  {
    id: 'corp-actions-coupons',
    category: 'corp-actions',
    name: 'Купоны',
    method: 'GET',
    legacyPath: '/iss/cci/corp-actions/coupons',
    newApiPath: '/corp-actions/coupons',
    description: 'Корпоративные действия по купонным выплатам.',
    params: [],
    responseObjects: ['cci_corp_actions_coupons', 'cci_corp_actions_coupons.cursor'],
    exampleResponse: `{
  "cci_corp_actions_coupons": {
    "columns": ["corp_action_id", "isin", "coupon_date", "coupon_value"],
    "data": [[8801, "RU000A0JX0J2", "2025-12-12T00:00:00", 42.5]]
  }
}`,
  },
  {
    id: 'corp-actions-meetings',
    category: 'corp-actions',
    name: 'Собрания акционеров',
    method: 'GET',
    legacyPath: '/iss/cci/corp-actions/meetings',
    newApiPath: '/corp-actions/meetings',
    description: 'Информация по собраниям акционеров и повесткам.',
    params: [],
    responseObjects: ['cci_corp_actions_meetings', 'cci_corp_actions_meetings.cursor'],
    exampleResponse: `{
  "cci_corp_actions_meetings": {
    "columns": ["corp_action_id", "basis_company_id", "meeting_date", "meeting_type"],
    "data": [[9102, 690, "2026-06-28T00:00:00", "Годовое ОСА"]]
  }
}`,
  },
  {
    id: 'reporting-corp-info',
    category: 'reporting',
    name: 'Корпоративная информация — отчёты',
    method: 'GET',
    legacyPath: '/iss/cci/reporting/corp-info/reports',
    newApiPath: '/reporting/corp-info/reports',
    description: 'Общая отчётность по корпоративной информации.',
    params: [
      { name: 'page', in: 'query', description: 'Номер страницы', example: '1' },
      { name: 'limit', in: 'query', description: 'Размер страницы', example: '100' },
    ],
    responseObjects: ['cci_corp_info', 'cci_corp_info.cursor'],
    exampleResponse: `{
  "cci_corp_info": {
    "columns": ["basis_ci_report_id", "basis_company_id", "period_id", "publication_date"],
    "data": [[3301, 690, "2025-Q3", "2025-11-15T10:00:00"]]
  }
}`,
  },
  {
    id: 'reporting-corp-info-one',
    category: 'reporting',
    name: 'Корпоративная информация — отчёт',
    method: 'GET',
    legacyPath: '/iss/cci/reporting/corp-info/reports/{report_id}',
    newApiPath: '/reporting/corp-info/reports/{report_id}',
    description: 'Детальные данные конкретного отчёта корпоративной информации.',
    params: [
      { name: 'report_id', in: 'path', required: true, description: 'basis_ci_report_id', example: '3301' },
    ],
    responseObjects: [
      'cci_corp_info_one',
      'cci_corp_info_fin_indicators',
      'cci_corp_info_plans',
      'cci_corp_info_owners',
      'cci_corp_info_risks',
    ],
    exampleResponse: `{
  "cci_corp_info_one": {
    "columns": ["basis_ci_report_id", "basis_company_id", "status_name_short_ru"],
    "data": [[3301, 690, "Опубликован"]]
  },
  "cci_corp_info_fin_indicators": {
    "columns": ["parameter_name_ru", "value"],
    "data": [["Выручка", 8420000]]
  }
}`,
  },
  {
    id: 'reporting-affiliates',
    category: 'reporting',
    name: 'Аффилированные лица',
    method: 'GET',
    legacyPath: '/iss/cci/reporting/affiliates/reports',
    newApiPath: '/reporting/affiliates/reports',
    description: 'Отчётность по аффилированным лицам.',
    params: [],
    responseObjects: ['cci_affiliates', 'cci_affiliates.cursor'],
    exampleResponse: `{
  "cci_affiliates": {
    "columns": ["basis_type_report_id", "basis_company_id", "period_id"],
    "data": [[4401, 690, "2025-Q2"]]
  }
}`,
  },
  {
    id: 'calendar-ir',
    category: 'calendar',
    name: 'Календарь инвестора',
    method: 'GET',
    legacyPath: '/iss/cci/calendars/ir-calendar',
    newApiPath: '/calendars/ir-calendar',
    description: 'Календарь IR-событий: отчётность, дивиденды, собрания, рейтинги.',
    params: [
      { name: 'basis_company_id', in: 'query', description: 'Фильтр по эмитенту' },
      { name: 'date_from', in: 'query', description: 'Начало периода', example: '2025-08-01' },
      { name: 'date_to', in: 'query', description: 'Конец периода', example: '2025-12-31' },
    ],
    responseObjects: ['cci_ir_calendar', 'cci_ir_calendar.cursor'],
    exampleResponse: `{
  "cci_ir_calendar": {
    "columns": ["event_date", "basis_company_id", "event_type_name_ru", "description"],
    "data": [["2025-12-18T00:00:00", 690, "Дивиденды", "Рекомендация по дивидендам"]]
  }
}`,
  },
]

export function buildEndpointUrl(endpoint: ApiEndpointDefinition, apiVersion: 'legacy' | 'new' = 'new') {
  const base = apiVersion === 'legacy' ? CCI_ISS_BASE_URL : CCI_NEW_API_BASE_URL
  const path = apiVersion === 'legacy' ? endpoint.legacyPath : endpoint.newApiPath
  return `${base}${path}`
}

export function buildSampleRequest(endpoint: ApiEndpointDefinition, apiVersion: 'legacy' | 'new' = 'new') {
  let path = apiVersion === 'legacy' ? endpoint.legacyPath : endpoint.newApiPath
  endpoint.params
    .filter((param) => param.in === 'path' && param.example)
    .forEach((param) => {
      path = path.replace(`{${param.name}}`, param.example!)
    })

  const query = endpoint.params
    .filter((param) => param.in === 'query' && param.example)
    .map((param) => `${param.name}=${encodeURIComponent(param.example!)}`)
    .join('&')

  const base = apiVersion === 'legacy' ? CCI_ISS_BASE_URL : CCI_NEW_API_BASE_URL
  return query ? `${base}${path}?${query}` : `${base}${path}`
}
