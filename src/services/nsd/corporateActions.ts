import {
  liveGetCompanyCorporateActions,
  liveGetCorporateActionsCalendar,
  liveGetCorporateActionsFeed,
} from '../api/live/moexLive'
import { withLiveFallback } from '../api/withFallback'
import type {
  CompanyCorporateActionItem,
  CorporateActionCalendarItem,
  CorporateActionFeedItem,
} from '../../types/corporateAction'
import {
  mockCompanyActions,
  mockCorporateActionsCalendar,
  mockCorporateActionsFeed,
} from './mocks'

export async function nsdGetCompanyCorporateActions(companyId: string): Promise<CompanyCorporateActionItem[]> {
  const { data } = await withLiveFallback(
    () => liveGetCompanyCorporateActions(companyId),
    async () => mockCompanyActions[companyId] ?? [],
  )
  return data
}

export async function nsdGetCorporateActionsFeed(): Promise<CorporateActionFeedItem[]> {
  const { data } = await withLiveFallback(
    () => liveGetCorporateActionsFeed(),
    async () => mockCorporateActionsFeed,
  )
  return data
}

export async function nsdGetCorporateActionsCalendar(): Promise<CorporateActionCalendarItem[]> {
  const { data } = await withLiveFallback(
    () => liveGetCorporateActionsCalendar(),
    async () => mockCorporateActionsCalendar,
  )
  return data
}
