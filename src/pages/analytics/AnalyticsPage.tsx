import { useMemo, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Calculator } from 'lucide-react'
import { IndicatorTooltip } from '../../components/analytics/IndicatorTooltip'
import { BASIC_FINANCIAL_INDICATORS } from '../../services/analytics/indicators'
import { nsdCalculateComparisonIndicators, nsdGetComparisonCompaniesMeta } from '../../services/nsd/analytics'
import { DataSourceBadge } from '../../components/DataSourceBadge'

export function AnalyticsPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/analytics/banks' }) as { compareIds?: string[] }
  const compareIds = search.compareIds ?? []

  const { data: companiesMeta, isLoading: metaLoading } = useQuery({
    queryKey: ['comparison-companies-meta', compareIds],
    queryFn: () => nsdGetComparisonCompaniesMeta(compareIds),
    enabled: compareIds.length > 0,
  })

  const [calculated, setCalculated] = useState(false)

  const calculateMutation = useMutation({
    mutationFn: () => nsdCalculateComparisonIndicators(compareIds),
    onSuccess: () => setCalculated(true),
  })

  const result = calculateMutation.data
  const canCalculate = compareIds.length >= 2

  const indicatorRows = useMemo(() => BASIC_FINANCIAL_INDICATORS, [])

  const source = result?.companies.some((c) => c.source === 'live') ? 'live' : 'mock'

  return (
    <div className="page-grid">
      <section className="hero-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="eyebrow">Analytics</div>
          {calculated && result ? <DataSourceBadge source={source} /> : null}
        </div>
        <h1>Расчёт финансовых индикаторов</h1>
        <p>
          Выберите 2–5 компаний на странице «Компании», затем рассчитайте 20 базовых показателей
          на основе строк МСФО отчётности. Наведите на иконку — увидите формулу расчёта.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
          <button type="button" className="ghost-button" style={{ marginTop: 0 }} onClick={() => navigate({ to: '/companies', search: { q: undefined } })}>
            Выбрать компании
          </button>
          <button
            type="button"
            className="primary-button"
            disabled={!canCalculate || calculateMutation.isPending}
            onClick={() => calculateMutation.mutate()}
          >
            <Calculator size={16} />
            {calculateMutation.isPending ? 'Расчёт...' : 'Рассчитать индикаторы'}
          </button>
        </div>
      </section>

      {!canCalculate ? (
        <section className="panel-card">
          <div className="muted">Выберите минимум 2 компании для сравнения на странице «Компании».</div>
        </section>
      ) : null}

      {compareIds.length > 0 ? (
        <section className="panel-card">
          <div className="panel-header">
            <div className="eyebrow">Выбранные эмитенты</div>
            <div className="muted">{compareIds.length} компаний</div>
          </div>
          <div className="comparison-chip-list">
            {metaLoading ? (
              <div className="muted">Загрузка наименований...</div>
            ) : (
              (companiesMeta ?? compareIds.map((id) => ({ id, name: id, ticker: '—' }))).map((company) => (
                <div key={company.id} className="comparison-chip">
                  <div className="comparison-chip-name">{company.name}</div>
                  <div className="comparison-chip-meta">
                    {company.ticker !== '—' ? `${company.ticker} · ` : ''}
                    ID {company.id}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      ) : null}

      {calculateMutation.isError ? (
        <section className="panel-card">
          <div style={{ color: '#fca5a5' }}>
            Ошибка расчёта: {calculateMutation.error instanceof Error ? calculateMutation.error.message : 'неизвестная ошибка'}
          </div>
        </section>
      ) : null}

      {calculated && result?.companies.length ? (
        <section className="panel-card">
          <div className="panel-header">
            <div>
              <div className="eyebrow">20 базовых индикаторов</div>
              <div className="muted" style={{ marginTop: 6 }}>
                Периоды отчётности: {result.companies.map((c) => `${c.companyName} (${c.period})`).join(' · ')}
              </div>
            </div>
          </div>

          <div className="table-wrap" style={{ marginTop: 16 }}>
            <table className="data-table indicator-table">
              <thead>
                <tr>
                  <th style={{ minWidth: 220 }}>Индикатор</th>
                  {result.companies.map((company) => (
                    <th key={company.companyId}>
                      <div>{company.companyName}</div>
                      <div className="muted" style={{ fontWeight: 400, fontSize: 11 }}>{company.ticker}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {indicatorRows.map((definition) => (
                  <tr key={definition.id}>
                    <td>
                      <div className="indicator-name-cell">
                        <span className="indicator-name">{definition.name}</span>
                        <IndicatorTooltip definition={definition} />
                      </div>
                      <div className="indicator-full-name muted">{definition.fullName}</div>
                    </td>
                    {result.companies.map((company) => {
                      const value = company.indicators.find((item) => item.indicatorId === definition.id)
                      return (
                        <td key={`${company.companyId}-${definition.id}`} className="indicator-value">
                          {value?.formatted ?? '—'}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {calculated && result && !result.companies.length ? (
        <section className="panel-card">
          <div className="muted">Не удалось загрузить финансовую отчётность для выбранных компаний.</div>
        </section>
      ) : null}
    </div>
  )
}
