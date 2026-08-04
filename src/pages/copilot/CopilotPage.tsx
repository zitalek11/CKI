import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Sparkles } from 'lucide-react'
import { nsdGetCompaniesList } from '../../services/nsd/companiesList'
import type { CompanyListItem } from '../../types/companyComparison'

const examplePrompts = [
  'Покажи финансовые показатели Газпрома за последние 10 лет',
  'Сравни Сбер, ВТБ и Т-Технологии',
  'Какие дивиденды ожидаются в августе?',
  'Покажи компании с ростом EBITDA >20%',
]

export function CopilotPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const { data: companiesResult } = useQuery({
    queryKey: ['companies-list'],
    queryFn: () => nsdGetCompaniesList(),
  })
  const companies = companiesResult?.items

  const suggestions = useMemo(() => {
    if (!query.trim()) return examplePrompts
    const q = query.toLowerCase()
    return examplePrompts.filter((item) => item.toLowerCase().includes(q))
  }, [query])

  const handleSubmit = () => {
    const text = query.trim().toLowerCase()
    if (text.includes('газпром')) {
      navigate({ to: '/companies/$id', params: { id: 'MOEX_GAZP' } })
      return
    }
    if (text.includes('сбер')) {
      navigate({ to: '/companies/$id', params: { id: 'MOEX_SBER' } })
      return
    }
    if (text.includes('сравн')) {
      navigate({ to: '/analytics/banks', search: { compareIds: ['MOEX_SBER', 'MOEX_VTBR'] } })
      return
    }
    if (text.includes('дивиденд') || text.includes('корп')) {
      navigate({ to: '/corporate-actions' })
      return
    }
    navigate({ to: '/companies', search: { q: query.trim() || undefined } })
  }

  return (
    <div className="page-grid">
      <section className="hero-card copilot-hero">
        <div className="eyebrow">
          <Sparkles size={14} />
          AI Copilot
        </div>
        <h1>Что вы хотите узнать?</h1>
        <p>
          Задайте вопрос на естественном языке — система построит графики, таблицы, сравнения
          и карточки компаний на основе данных ЦКИ.
        </p>

        <div className="copilot-input-wrap">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Ask anything about companies or financial data..."
            className="copilot-input"
          />
          <button type="button" className="primary-button" onClick={handleSubmit}>
            Спросить
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="prompt-chips">
          {suggestions.map((prompt) => (
            <button key={prompt} type="button" className="prompt-chip" onClick={() => setQuery(prompt)}>
              {prompt}
            </button>
          ))}
        </div>
      </section>

      <section className="cards-grid cols-3">
        {(companies ?? []).slice(0, 6).map((company: CompanyListItem) => (
          <button
            key={company.id}
            type="button"
            className="metric-card clickable"
            onClick={() => navigate({ to: '/companies/$id', params: { id: company.id } })}
          >
            <div className="metric-label">{company.ticker}</div>
            <div className="metric-value small">{company.name}</div>
            <div className="metric-hint">{company.sector}</div>
          </button>
        ))}
      </section>
    </div>
  )
}
