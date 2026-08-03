import { useMemo } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { nsdGetCompanyKpiHistory, nsdGetCompanyProfile } from '../../services/nsd/companies'
import { nsdGetCompanyCorporateActions } from '../../services/nsd/corporateActions'

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

  const latest = useMemo(() => profile?.snapshot ?? kpis?.[0], [profile, kpis])

  if (profileLoading) {
    return <div style={{ color: '#94a3b8' }}>Загрузка профиля компании...</div>
  }

  if (!profile) {
    return (
      <div style={{ display: 'grid', gap: 12 }}>
        <div>Компания не найдена.</div>
        <button type="button" onClick={() => navigate({ to: '/companies' })}>Назад к списку компаний</button>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section style={{ borderRadius: 28, border: '1px solid rgba(148,163,184,0.15)', background: 'rgba(15,23,42,0.65)', padding: 24 }}>
        <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#94a3b8' }}>Company profile</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'start', marginTop: 10 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 34 }}>{profile.name}</h1>
            <div style={{ marginTop: 10, color: '#cbd5e1', fontSize: 14 }}>{profile.ticker} · {profile.isin} · {profile.sector} · {profile.industry}</div>
            <div style={{ marginTop: 8, color: '#94a3b8', fontSize: 13 }}>Карточка эмитента, KPI, отчётность и хронология корпоративных событий.</div>
          </div>
          <button type="button" onClick={() => navigate({ to: '/companies' })} style={{ borderRadius: 14, padding: '10px 14px', border: '1px solid rgba(148,163,184,0.15)', background: 'rgba(2,6,23,0.8)', color: '#e2e8f0' }}>Назад</button>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 16 }}>
        {[
          ['Price', latest?.price ?? '—'],
          ['Market Cap', latest?.marketCap ?? '—'],
          ['P/E', latest?.pe ?? '—'],
          ['ROE', latest?.roe ?? '—'],
        ].map(([label, value]) => (
          <div key={label as string} style={{ gridColumn: 'span 3', borderRadius: 22, border: '1px solid rgba(148,163,184,0.15)', background: 'rgba(15,23,42,0.65)', padding: 18 }}>
            <div style={{ color: '#94a3b8', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{label}</div>
            <div style={{ marginTop: 10, fontSize: 28, fontWeight: 800 }}>{value as string}</div>
          </div>
        ))}
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 16 }}>
        <div style={{ borderRadius: 24, border: '1px solid rgba(148,163,184,0.15)', background: 'rgba(15,23,42,0.65)', padding: 20 }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#94a3b8' }}>Отчётность</div>
          <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
            {(profile.reports ?? []).map((report) => (
              <div key={report.id} style={{ padding: 14, borderRadius: 16, background: 'rgba(2,6,23,0.75)', border: '1px solid rgba(148,163,184,0.12)' }}>
                <div style={{ fontWeight: 700 }}>{report.title}</div>
                <div style={{ marginTop: 6, color: '#94a3b8', fontSize: 13 }}>{report.period} · {report.publishedAt}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderRadius: 24, border: '1px solid rgba(148,163,184,0.15)', background: 'rgba(15,23,42,0.65)', padding: 20 }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#94a3b8' }}>Таймлайн</div>
          <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
            {(actions ?? []).map((item) => (
              <div key={item.id} style={{ padding: 14, borderRadius: 16, background: 'rgba(2,6,23,0.75)', border: '1px solid rgba(148,163,184,0.12)' }}>
                <div style={{ fontWeight: 700 }}>{item.title}</div>
                <div style={{ marginTop: 6, color: '#94a3b8', fontSize: 13 }}>{item.date} · {item.type}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
