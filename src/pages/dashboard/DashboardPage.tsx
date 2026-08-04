import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Sparkles } from 'lucide-react'
import { DashboardWidgets } from './DashboardWidgets'
import { FinanceBarChart } from '../../components/charts/FinanceCharts'
import { nsdGetDashboardStats, nsdGetDashboardSectorDistribution } from '../../services/nsd/dashboard'

export function DashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: nsdGetDashboardStats,
  })

  const { data: sectors } = useQuery({
    queryKey: ['dashboard-sectors'],
    queryFn: nsdGetDashboardSectorDistribution,
  })

  return (
    <div className="page-grid">
      <section className="hero-card">
        <div className="eyebrow">Dashboard</div>
        <h1>Что происходит на рынке сегодня?</h1>
        <p>
          Премиальный рабочий стол для CEO, инвестбанков, управляющих компаний и аналитиков.
          Каждый сценарий ЦКИ превращён в бизнес-инсайт, а не в сырой JSON.
        </p>
      </section>

      <section className="dashboard-top-grid">
        <div className="panel-card copilot-panel">
          <div className="panel-header">
            <div>
              <div className="eyebrow"><Sparkles size={14} /> AI Copilot</div>
              <div className="panel-title">Ask anything about companies or financial data...</div>
            </div>
            <div className="status-pill">Mock mode</div>
          </div>
          <div className="copilot-preview">
            Сравните Газпром и Роснефть, найдите компании с ростом EBITDA выше 20%,
            посмотрите дивиденды и корпоративные события на ближайший месяц.
          </div>
          <Link to="/ask" className="primary-button inline-link">
            Открыть Copilot
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="kpi-stack">
          {(stats ?? []).map((item) => (
            <div key={item.label} className="metric-card">
              <div className="metric-label">{item.label}</div>
              <div className="metric-value">{item.value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="dashboard-charts-grid">
        <div className="panel-card">
          <div className="eyebrow">Reports by sector</div>
          <div className="panel-title">Распределение эмитентов</div>
          <FinanceBarChart data={sectors ?? []} dataKey="issuers" color="#3b82f6" />
        </div>
        <DashboardWidgets />
      </section>
    </div>
  )
}
