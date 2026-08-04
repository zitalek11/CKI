import { useMemo, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { DataSourceBadge } from '../../components/DataSourceBadge'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { nsdGetCompaniesList } from '../../services/nsd/companiesList'
import type { CompanyListItem } from '../../types/companyComparison'

export function CompaniesPage() {
  const navigate = useNavigate()
  const searchParams = useSearch({ from: '/companies' }) as { q?: string }
  const [search, setSearch] = useState(searchParams.q ?? '')
  const [sector, setSector] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const debouncedSearch = useDebouncedValue(search)

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['companies-list', sector, debouncedSearch],
    queryFn: () => nsdGetCompaniesList({
      sector: sector || undefined,
      q: debouncedSearch || undefined,
      limit: 50,
    }),
    placeholderData: (previous) => previous,
  })

  const filtered = useMemo<CompanyListItem[]>(() => data?.items ?? [], [data])
  const source = data?.source ?? 'mock'

  const toggleSelected = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 5 ? [...prev, id] : prev)
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'end' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#94a3b8' }}>Компании</div>
            <DataSourceBadge source={source} />
          </div>
          <h1 style={{ margin: '8px 0 0', fontSize: 30 }}>Российские эмитенты</h1>
          <p style={{ margin: '8px 0 0', color: '#94a3b8', fontSize: 14 }}>Список эмитентов, фильтры, поиск и выбор до 5 компаний для сравнения.</p>
        </div>
        <button
          type="button"
          disabled={selected.length < 2}
          onClick={() => navigate({ to: '/analytics/banks', search: { compareIds: selected } })}
          style={{ borderRadius: 14, padding: '12px 16px', border: '1px solid rgba(148,163,184,0.15)', background: selected.length < 2 ? 'rgba(30,41,59,0.5)' : '#22c55e', color: selected.length < 2 ? '#94a3b8' : '#020617', fontWeight: 700, cursor: selected.length < 2 ? 'not-allowed' : 'pointer' }}
        >
          Сравнить выбранные ({selected.length})
        </button>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>
        <aside style={{ borderRadius: 24, border: '1px solid rgba(148,163,184,0.15)', background: 'rgba(15,23,42,0.65)', padding: 20 }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#94a3b8' }}>Фильтры</div>
          <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
            <label style={{ display: 'grid', gap: 6, fontSize: 13 }}>
              <span style={{ color: '#94a3b8' }}>Поиск</span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Название, тикер, ISIN" style={{ borderRadius: 12, border: '1px solid rgba(148,163,184,0.15)', background: 'rgba(2,6,23,0.85)', color: '#e2e8f0', padding: '10px 12px' }} />
            </label>
            <label style={{ display: 'grid', gap: 6, fontSize: 13 }}>
              <span style={{ color: '#94a3b8' }}>Сектор</span>
              <select value={sector} onChange={(e) => setSector(e.target.value)} style={{ borderRadius: 12, border: '1px solid rgba(148,163,184,0.15)', background: 'rgba(2,6,23,0.85)', color: '#e2e8f0', padding: '10px 12px' }}>
                <option value="">Все</option>
                <option value="Финансовый сектор">Финансовый сектор</option>
                <option value="Нефть и газ">Нефть и газ</option>
                <option value="Металлы">Металлы</option>
                <option value="Энергетика">Энергетика</option>
                <option value="Транспорт">Транспорт</option>
              </select>
            </label>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Выбрано для сравнения: {selected.length} / 5</div>
          </div>
        </aside>

        <div style={{ borderRadius: 24, border: '1px solid rgba(148,163,184,0.15)', background: 'rgba(15,23,42,0.65)', padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#94a3b8' }}>Список эмитентов</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#94a3b8' }}>
              {isFetching && !isLoading ? <span>Обновление...</span> : null}
              <span>{filtered.length} найдено</span>
            </div>
          </div>

          <div style={{ marginTop: 16, overflow: 'auto' }}>
            {isLoading ? (
              <div style={{ color: '#94a3b8' }}>Загрузка компаний из MOEX CCI...</div>
            ) : isError ? (
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ color: '#fca5a5' }}>
                  Не удалось загрузить данные: {error instanceof Error ? error.message : 'неизвестная ошибка'}
                </div>
                <button type="button" className="ghost-button" onClick={() => refetch()}>Повторить</button>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ color: '#94a3b8' }}>Ничего не найдено. Попробуйте изменить запрос.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ color: '#94a3b8', fontSize: 12, textAlign: 'left' }}>
                    <th style={{ padding: '10px 8px' }}>Сравнение</th>
                    <th style={{ padding: '10px 8px' }}>Эмитент</th>
                    <th style={{ padding: '10px 8px' }}>Тикер</th>
                    <th style={{ padding: '10px 8px' }}>ISIN</th>
                    <th style={{ padding: '10px 8px' }}>Сектор</th>
                    <th style={{ padding: '10px 8px' }}>Отрасль</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id} style={{ borderTop: '1px solid rgba(148,163,184,0.12)' }}>
                      <td style={{ padding: '10px 8px' }}>
                        <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggleSelected(c.id)} />
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        <button type="button" onClick={() => navigate({ to: '/companies/$id', params: { id: c.id } })} style={{ background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', padding: 0, fontWeight: 600 }}>{c.name}</button>
                      </td>
                      <td style={{ padding: '10px 8px', color: '#94a3b8' }}>{c.ticker}</td>
                      <td style={{ padding: '10px 8px', color: '#94a3b8' }}>{c.isin}</td>
                      <td style={{ padding: '10px 8px', color: '#94a3b8' }}>{c.sector}</td>
                      <td style={{ padding: '10px 8px', color: '#94a3b8' }}>{c.industry}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
