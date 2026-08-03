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
