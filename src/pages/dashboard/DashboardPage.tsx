import { DashboardWidgets } from './DashboardWidgets'

export function DashboardPage() {
  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section style={{ display: 'grid', gap: 12, padding: 28, borderRadius: 24, border: '1px solid rgba(148,163,184,0.15)', background: 'rgba(15,23,42,0.65)', boxShadow: '0 24px 60px rgba(0,0,0,0.35)' }}>
        <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#94a3b8' }}>Dashboard</div>
        <h1 style={{ fontSize: 34, lineHeight: 1.1, margin: 0 }}>Что происходит на рынке сегодня?</h1>
        <p style={{ margin: 0, maxWidth: 760, color: '#cbd5e1', fontSize: 15 }}>Премиальный рабочий стол для CEO, инвестбанков, управляющих компаний и аналитиков. Здесь каждый API‑эндпоинт превращается в бизнес‑сценарий, а не в сырую JSON‑таблицу.</p>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 16 }}>
        <div style={{ gridColumn: 'span 8', borderRadius: 24, border: '1px solid rgba(148,163,184,0.15)', background: 'rgba(15,23,42,0.65)', padding: 20, minHeight: 320 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em' }}>AI Copilot</div>
              <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>Ask anything about companies or financial data...</div>
            </div>
            <div style={{ fontSize: 12, color: '#22c55e' }}>Mock mode ready</div>
          </div>
          <div style={{ borderRadius: 20, border: '1px solid rgba(148,163,184,0.15)', background: 'rgba(2,6,23,0.8)', padding: 18, minHeight: 170 }}>
            <div style={{ color: '#cbd5e1', fontSize: 14 }}>Например: сравнить Газпром и Роснефть, показать компании с ростом EBITDA выше 20%, найти эмитентов с ухудшающейся долговой нагрузкой.</div>
          </div>
        </div>
        <div style={{ gridColumn: 'span 4', display: 'grid', gap: 16 }}>
          {[
            ['Recent disclosures', '24'],
            ['Upcoming dividends', '17'],
            ['Upcoming coupon payments', '31'],
            ['New financial reports', '9'],
          ].map(([label, value]) => (
            <div key={label} style={{ borderRadius: 20, border: '1px solid rgba(148,163,184,0.15)', background: 'rgba(15,23,42,0.65)', padding: 18 }}>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>{label}</div>
              <div style={{ fontSize: 30, fontWeight: 800, marginTop: 8 }}>{value}</div>
            </div>
          ))}
        </div>
      </section>

      <DashboardWidgets />
    </div>
  )
}
