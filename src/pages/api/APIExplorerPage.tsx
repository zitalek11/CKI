import { useMemo, useState } from 'react'

const endpoints = [
  {
    name: 'Companies',
    method: 'GET',
    path: '/api/getcompanies',
    description: 'Список эмитентов, фильтры и поиск.',
    params: ['sector', 'industry', 'limit'],
    exampleResponse: '{\n  "companies": [\n    { "id": "sber", "name": "Сбербанк", "ticker": "SBER" }\n  ]\n}',
  },
  {
    name: 'Company profile',
    method: 'GET',
    path: '/api/getcompanies?id={id}',
    description: 'Карточка эмитента, KPI и отчётность.',
    params: ['id'],
    exampleResponse: '{\n  "company": { "id": "sber", "name": "Сбербанк" }\n}',
  },
  {
    name: 'Corporate actions',
    method: 'GET',
    path: '/api/getcompanyactions?companyId={id}',
    description: 'Календарь и лента корпоративных событий.',
    params: ['companyId'],
    exampleResponse: '{\n  "actions": [\n    { "id": "1", "title": "Dividend announcement" }\n  ]\n}',
  },
]

export function APIExplorerPage() {
  const [selected, setSelected] = useState(endpoints[0])
  const paramList = useMemo(() => selected.params.join(', '), [selected])

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section style={{ borderRadius: 28, border: '1px solid rgba(148,163,184,0.15)', background: 'rgba(15,23,42,0.65)', padding: 24 }}>
        <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#94a3b8' }}>API Explorer</div>
        <h1 style={{ margin: '10px 0 0', fontSize: 34 }}>Техническая панель эндпоинтов</h1>
        <p style={{ margin: '8px 0 0', color: '#94a3b8', fontSize: 14 }}>Последний этап: быстрый обзор основных API, входных параметров и ожидаемых ответов.</p>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>
        <aside style={{ borderRadius: 24, border: '1px solid rgba(148,163,184,0.15)', background: 'rgba(15,23,42,0.65)', padding: 20 }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#94a3b8' }}>Endpoints</div>
          <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
            {endpoints.map((ep) => (
              <button
                key={ep.path}
                type="button"
                onClick={() => setSelected(ep)}
                style={{
                  textAlign: 'left',
                  padding: 14,
                  borderRadius: 16,
                  border: '1px solid rgba(148,163,184,0.12)',
                  background: ep.path === selected.path ? 'rgba(59,130,246,0.18)' : 'rgba(2,6,23,0.75)',
                  color: '#e2e8f0',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontWeight: 700 }}>{ep.name}</div>
                <div style={{ marginTop: 6, color: '#94a3b8', fontSize: 12 }}>{ep.method} {ep.path}</div>
              </button>
            ))}
          </div>
        </aside>

        <div style={{ display: 'grid', gap: 16 }}>
          <section style={{ borderRadius: 24, border: '1px solid rgba(148,163,184,0.15)', background: 'rgba(15,23,42,0.65)', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em' }}>{selected.method}</div>
                <div style={{ marginTop: 6, fontSize: 22, fontWeight: 800 }}>{selected.name}</div>
              </div>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>{selected.path}</div>
            </div>
            <p style={{ marginTop: 12, color: '#cbd5e1', fontSize: 14 }}>{selected.description}</p>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ borderRadius: 24, border: '1px solid rgba(148,163,184,0.15)', background: 'rgba(15,23,42,0.65)', padding: 20 }}>
              <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#94a3b8' }}>Параметры</div>
              <div style={{ marginTop: 16, color: '#e2e8f0', fontSize: 14 }}>{paramList || 'Нет параметров'}</div>
            </div>

            <div style={{ borderRadius: 24, border: '1px solid rgba(148,163,184,0.15)', background: 'rgba(15,23,42,0.65)', padding: 20 }}>
              <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#94a3b8' }}>Пример ответа</div>
              <pre style={{ marginTop: 16, whiteSpace: 'pre-wrap', color: '#cbd5e1', fontSize: 13, lineHeight: 1.5 }}>{selected.exampleResponse}</pre>
            </div>
          </section>
        </div>
      </section>
    </div>
  )
}
