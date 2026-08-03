export function DashboardWidgets() {
  return (
    <section style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(12, minmax(0, 1fr))' }}>
      <div style={{ gridColumn: 'span 4', borderRadius: 24, border: '1px solid rgba(148,163,184,0.15)', background: 'rgba(15,23,42,0.65)', padding: 20 }}>
        <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Recent corporate disclosures</div>
        <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
          {['Газпром — отчётность IFRS', 'Сбербанк — раскрытие по дивидендам', 'ЛУКОЙЛ — корпоративное сообщение'].map((item) => (
            <div key={item} style={{ padding: 12, borderRadius: 16, background: 'rgba(2,6,23,0.75)', border: '1px solid rgba(148,163,184,0.12)', color: '#cbd5e1', fontSize: 13 }}>{item}</div>
          ))}
        </div>
      </div>

      <div style={{ gridColumn: 'span 4', borderRadius: 24, border: '1px solid rgba(148,163,184,0.15)', background: 'rgba(15,23,42,0.65)', padding: 20 }}>
        <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Market activity feed</div>
        <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
          {['Новые отчёты сегодня', 'Изменения рейтингов', 'Крупные корпоративные действия'].map((item) => (
            <div key={item} style={{ padding: 12, borderRadius: 16, background: 'rgba(2,6,23,0.75)', border: '1px solid rgba(148,163,184,0.12)', color: '#cbd5e1', fontSize: 13 }}>{item}</div>
          ))}
        </div>
      </div>

      <div style={{ gridColumn: 'span 4', borderRadius: 24, border: '1px solid rgba(148,163,184,0.15)', background: 'rgba(15,23,42,0.65)', padding: 20 }}>
        <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Timeline intelligence</div>
        <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
          {['Сегодня — купоны', 'Завтра — собрания акционеров', 'На неделе — отчётность'].map((item) => (
            <div key={item} style={{ padding: 12, borderRadius: 16, background: 'rgba(2,6,23,0.75)', border: '1px solid rgba(148,163,184,0.12)', color: '#cbd5e1', fontSize: 13 }}>{item}</div>
          ))}
        </div>
      </div>
    </section>
  )
}
