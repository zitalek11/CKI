import { useMemo } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { DataSourceBadge } from '../../components/DataSourceBadge'
import { nsdGetCompanyKpiHistory, nsdGetCompanyProfile } from '../../services/nsd/companies'
import { nsdGetCompanyCorporateActions } from '../../services/nsd/corporateActions'
import { getApiMode } from '../../services/api/config'
import { FinanceBarChart, FinanceLineChart } from '../../components/charts/FinanceCharts'

function formatMillions(value?: number) {
  if (value == null) return '—'
  return `${value.toLocaleString('ru-RU')} млн`
}

export function CompanyProfilePage() {
  const navigate = useNavigate()
  const { id } = useParams({ from: '/companies/$id' })

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['company-profile', id],
    queryFn: () => nsdGetCompanyProfile(id),
  })

  const { data: kpis } = useQuery({
    queryKey: ['company-kpis', id],
    queryFn: () => nsdGetCompanyKpiHistory(id),
  })

  const { data: actions } = useQuery({
    queryKey: ['company-actions', id],
    queryFn: () => nsdGetCompanyCorporateActions(id),
  })

  const latest = useMemo(() => kpis?.[0] ?? profile?.snapshot, [profile, kpis])
  const isLiveProfile = getApiMode() !== 'mock' && !id.startsWith('MOEX_')

  const revenueChart = useMemo(
    () => [...(kpis ?? [])].reverse().map((item) => ({
      label: item.date,
      revenue: item.revenue ?? 0,
      ebitda: item.ebitda ?? 0,
    })),
    [kpis],
  )

  if (profileLoading) {
    return <div className="muted">Загрузка профиля компании...</div>
  }

  if (!profile) {
    return (
      <div className="page-grid">
        <div>Компания не найдена.</div>
        <button type="button" className="ghost-button" onClick={() => navigate({ to: '/companies', search: { q: undefined } })}>
          Назад к списку компаний
        </button>
      </div>
    )
  }

  return (
    <div className="page-grid">
      <section className="hero-card">
        <div className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>Company profile</span>
          <DataSourceBadge source={isLiveProfile ? 'live' : 'mock'} />
        </div>
        <div className="panel-header">
          <div>
            <h1>{profile.name}</h1>
            <p>{profile.ticker} · {profile.isin} · {profile.sector} · {profile.industry}</p>
            <p className="muted">{profile.description}</p>
          </div>
          <button type="button" className="ghost-button" onClick={() => navigate({ to: '/companies', search: { q: undefined } })}>
            Назад
          </button>
        </div>
      </section>

      <section className="kpi-grid">
        {[
          ['Revenue', formatMillions(latest?.revenue)],
          ['EBITDA', formatMillions(latest?.ebitda)],
          ['Net profit', formatMillions(latest?.netProfit)],
          ['ROE', latest?.roe ?? '—'],
        ].map(([label, value]) => (
          <div key={label} className="metric-card">
            <div className="metric-label">{label}</div>
            <div className="metric-value">{value}</div>
          </div>
        ))}
      </section>

      <section className="profile-grid">
        <div className="panel-card">
          <div className="eyebrow">Revenue dynamics</div>
          <FinanceLineChart data={revenueChart} dataKey="revenue" color="#3b82f6" />
        </div>
        <div className="panel-card">
          <div className="eyebrow">EBITDA</div>
          <FinanceBarChart data={revenueChart} dataKey="ebitda" color="#22c55e" height={220} />
        </div>
      </section>

      <section className="profile-grid">
        <div className="panel-card">
          <div className="eyebrow">Отчётность</div>
          <div className="feed-list">
            {(profile.reports ?? []).map((report) => (
              <div key={report.id} className="feed-item">
                <div style={{ fontWeight: 700 }}>{report.title}</div>
                <div className="muted">{report.period} · {report.publishedAt} · {report.standard}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel-card">
          <div className="eyebrow">Таймлайн</div>
          <div className="feed-list">
            {(actions ?? []).map((item) => (
              <div key={item.id} className="feed-item">
                <div style={{ fontWeight: 700 }}>{item.title}</div>
                <div className="muted">{item.date} · {item.type}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
