import { isMockMode, nsdClient } from './client'
import { mockCompanies } from './mocks'
import type { CorporateAction } from '../../types/corporateAction'

export async function nsdGetCorporateActions(params?: { fromDate?: string; toDate?: string; type?: string }): Promise<CorporateAction[]> {
  if (isMockMode) {
    const now = new Date()
    const actions: CorporateAction[] = []
    mockCompanies.forEach((issuer) => {
      for (let i = 0; i < 16; i++) {
        const d = new Date(now)
        d.setDate(now.getDate() + i * 3)
        actions.push({
          id: `${issuer.id}-div-${i}`,
          issuerId: issuer.id,
          issuerName: issuer.name,
          type: 'dividend',
          date: d.toISOString(),
          description: `Дивиденд по акциям ${issuer.ticker}`,
          amount: 12 + i,
          currency: 'RUB',
          important: i % 5 === 0,
        })
      }
    })
    return actions
  }

  const { data } = await nsdClient.get('/api/getcorporateactions', { params })
  return (data.actions ?? []) as CorporateAction[]
}
