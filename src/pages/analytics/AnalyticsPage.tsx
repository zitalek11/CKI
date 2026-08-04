import { useMemo } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { nsdGetCompaniesComparison } from '../../services/nsd/companiesList'
import { formatMoney } from '../../utils/formatters'

export function AnalyticsPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/analytics/banks' }) as { compareIds?: string[] }
  const compareIds = search.compareIds ?? ['MOEX_SBER', 'MOEX_VTBR', 'MOEX_GAZP']

  const { data, isLoading } = useQuery({
    queryKey: ['companies-comparison', compareIds],
    queryFn: () => nsdGetCompaniesComparison(compareIds),
    enabled: compareIds.length > 0,
  })

  const bestRevenue = useMemo(() => {
    if (!data?.length) return null
    return [...data].sort((a, b) => (b.latestKpi?.revenue ?? 0) - (a.latestKpi?.revenue ?? 0))[0]
  }, [data])

  return (
    <div className="page-grid">
      <section className="hero-card">
        <div className="eyebrow">Analytics</div>
        <h1>Сравнение эмитентов</h1>
        <p>Интерактивное сравнение до 5 компаний по ключевым финансовым показателям.</p>
        <button type="button" className="ghost-button" onClick={() => navigate({ to: '/companies', search: { q: undefined } })}>
          Выбрать другие компании
        </button>
      </section>

      <section className="panel-card">
        <div className="panel-header">
          <div className="eyebrow">Comparison table</div>
          <div className="muted">{compareIds.length} эмитентов</div>
        </div>

        {isLoading ? (
          <div className="muted">Загрузка сравнения...</div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Эмитент</th>
                  <th>Тикер</th>
                  <th>Сектор</th>
                  <th>Revenue</th>
                  <th>EBITDA</th>
                  <th>Net Profit</th>
                  <th>ROE</th>
                </tr>
              </thead>
              <tbody>
                {(data ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>
                      <button
                        type="button"
                        className="link-button"
                        onClick={() => navigate({ to: '/companies/$id', params: { id: item.id } })}
                      >
                        {item.name}
                      </button>
                    </td>
                    <td className="muted">{item.ticker}</td>
                    <td className="muted">{item.sector}</td>
                    <td>{formatMoney(item.latestKpi?.revenue)}</td>
                    <td>{formatMoney(item.latestKpi?.ebitda)}</td>
                    <td>{formatMoney(item.latestKpi?.netProfit)}</td>
                    <td>{item.latestKpi?.roe ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {bestRevenue ? (
        <section className="cards-grid cols-3">
          <div className="metric-card highlight">
            <div className="metric-label">Best performer</div>
            <div className="metric-value small">{bestRevenue.name}</div>
            <div className="metric-hint">Максимальная выручка в выборке</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Revenue</div>
            <div className="metric-value">{formatMoney(bestRevenue.latestKpi?.revenue)}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">EBITDA</div>
            <div className="metric-value">{formatMoney(bestRevenue.latestKpi?.ebitda)}</div>
          </div>
        </section>
      ) : null}
    </div>
  )
}
