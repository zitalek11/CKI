export interface MoexCompanyRecord {
  basis_company_id: number
  name_short_ru?: string | null
  name_full_ru?: string | null
  inn?: string | null
  ogrn?: string | null
  nation_name_short_ru?: string | null
  address?: string | null
  update_time?: string | null
}

export interface MoexCompanyIndustryRecord {
  basis_company_id: number
  company_name_short_ru?: string | null
  industry_name_short_ru?: string | null
}

export interface MoexNewApiListResponse<T> {
  data: T[]
  cursor?: {
    total?: number
    page?: number
    limit?: number
  }
}

export interface MoexDividendRecord {
  basis_corp_action_id: number
  basis_company_id?: number | null
  company_name_full_ru?: string | null
  corp_action_type_name?: string | null
  pay_interval?: string | null
  update_time?: string | null
}

export interface MoexCouponRecord {
  basis_corp_action_id: number
  basis_company_id?: number | null
  company_name_full_ru?: string | null
  coupon_date?: string | null
  update_time?: string | null
}

export interface MoexMsfoReportRecord {
  basis_type_report_id: number
  basis_company_id: number
  company_name_short_ru?: string | null
  report_publicate_date?: string | null
  period_name_short_ru?: string | null
  period_code?: string | null
  type_report_name_short_ru?: string | null
  scale_name_short_ru?: string | null
  currency_name_short_ru?: string | null
}

export interface MoexMsfoReportValueRecord {
  parameter_name_short_ru?: string | null
  parameter_period_name_short_ru?: string | null
  value?: number | null
  line_code?: string | null
}
