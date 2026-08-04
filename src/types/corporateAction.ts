export type CorporateActionType =
  | 'dividend'
  | 'coupon'
  | 'meeting'
  | 'buyback'
  | 'offer'
  | 'split'
  | 'issue'
  | 'maturity'
  | 'ratingReview'

export interface CorporateAction {
  id: string
  issuerId: string
  issuerName: string
  type: CorporateActionType
  date: string
  description: string
  amount?: number
  currency?: string
  isin?: string
  important?: boolean
}

export interface CompanyCorporateActionItem {
  id: string
  title: string
  date: string
  type: string
}

export interface CorporateActionFeedItem {
  id: string
  title: string
  date: string
  sector: string
  type: CorporateActionType
}

export interface CorporateActionCalendarItem {
  id: string
  title: string
  date: string
  type: CorporateActionType
}
