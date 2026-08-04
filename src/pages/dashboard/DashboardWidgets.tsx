import { useQuery } from '@tanstack/react-query'
import { FinanceLineChart } from '../../components/charts/FinanceCharts'
import {
  nsdGetDashboardDisclosures,
  nsdGetDashboardFeed,
  nsdGetDashboardTimeline,
} from '../../services/nsd/dashboard'

export function DashboardWidgets() {
  const { data: disclosures } = useQuery({
    queryKey: ['dashboard-disclosures'],
    queryFn: nsdGetDashboardDisclosures,
  })

  const { data: feed } = useQuery({
    queryKey: ['dashboard-feed'],
    queryFn: nsdGetDashboardFeed,
  })

  const { data: timeline } = useQuery({
    queryKey: ['dashboard-timeline'],
    queryFn: nsdGetDashboardTimeline,
  })

  return (
    <>
      <div className="panel-card">
        <div className="eyebrow">Recent corporate disclosures</div>
        <div className="feed-list">
          {(disclosures ?? []).map((item) => (
            <div key={item} className="feed-item">{item}</div>
          ))}
        </div>
      </div>

      <div className="panel-card">
        <div className="eyebrow">Market activity feed</div>
        <div className="feed-list">
          {(feed ?? []).map((item) => (
            <div key={item.id} className="feed-item">
              <div>{item.title}</div>
              <div className="muted">{item.date} · {item.sector}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel-card">
        <div className="eyebrow">Corporate action timeline</div>
        <FinanceLineChart data={timeline ?? []} dataKey="dividends" color="#22c55e" height={220} />
      </div>
    </>
  )
}
