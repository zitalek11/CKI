import { isMockMode, nsdClient } from './client'
import { mockCompanyProfiles, mockCompanyKpis } from './mocks'

export async function nsdGetCompanyProfile(id: string) {
  if (isMockMode) return mockCompanyProfiles[id] ?? null
  const { data } = await nsdClient.get('/api/getcompanies', { params: { id } })
  return data.company ?? null
}

export async function nsdGetCompanyKpiHistory(id: string) {
  if (isMockMode) return mockCompanyKpis[id] ?? []
  const { data } = await nsdClient.get('/api/getcompanykpis', { params: { id } })
  return data.history ?? []
}
