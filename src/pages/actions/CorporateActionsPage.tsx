import { useQuery } from '@tanstack/react-query'
import { nsdGetCorporateActionsFeed, nsdGetCorporateActionsCalendar } from '../../services/nsd/corporateActions'

export function CorporateActionsPage() {
  const { data: feed } = useQuery({
    queryKey: ['corporate-actions-feed'],
    queryFn: nsdGetCorporateActionsFeed,
  })

  const { data: calendar } = useQuery({
    queryKey: ['corporate-actions-calendar'],
    queryFn: nsdGetCorporateActionsCalendar,
  })

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section style={{ borderRadius: 28, border: '1px solid rgba(148,163,184,0.15)', background: 'rgba(15,23,42,0.65)', padding: 24 }}>
        <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#94a3b8' }}>Corporate actions</div>
        <h1 style={{ margin: '10px 0 0', fontSize: 34 }}>Календарь и лента событий</h1>
        <p style={{ margin: '8px 0 0', color: '#94a3b8', fontSize: 14 }}>Следим за дивидендами, собраниями, купонами, отчётностью и ключевыми корпоративными событиями.</p>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ borderRadius: 24, border: '1px solid rgba(148,163,184,0.15)', background: 'rgba(15,23,42,0.65)', padding: 20 }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#94a3b8' }}>Календарь</div>
          <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
            {(calendar ?? []).map((item) => (
              <div key={item.id} style={{ padding: 14, borderRadius: 16, background: 'rgba(2,6,23,0.75)', border: '1px solid rgba(148,163,184,0.12)' }}>
                <div style={{ fontWeight: 700 }}>{item.date} · {item.title}</div>
                <div style={{ marginTop: 6, color: '#94a3b8', fontSize: 13 }}>{item.type}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderRadius: 24, border: '1px solid rgba(148,163,184,0.15)', background: 'rgba(15,23,42,0.65)', padding: 20 }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#94a3b8' }}>Лента событий</div>
          <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
            {(feed ?? []).map((item) => (
              <div key={item.id} style={{ padding: 14, borderRadius: 16, background: 'rgba(2,6,23,0.75)', border: '1px solid rgba(148,163,184,0.12)' }}>
                <div style={{ fontWeight: 700 }}>{item.title}</div>
                <div style={{ marginTop: 6, color: '#94a3b8', fontSize: 13 }}>{item.date} · {item.sector}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
