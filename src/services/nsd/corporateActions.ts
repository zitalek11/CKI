import { isMockMode, nsdClient } from './client'
import { mockCompanyActions } from './mocks'

export async function nsdGetCompanyCorporateActions(companyId: string) {
  if (isMockMode) return mockCompanyActions[companyId] ?? []
  const { data } = await nsdClient.get('/api/getcompanyactions', { params: { companyId } })
  return data.actions ?? []
}
