type DataSource = 'live' | 'mock'

export function DataSourceBadge({ source }: { source: DataSource }) {
  const isLive = source === 'live'
  return (
    <span
      className={`data-source-badge${isLive ? ' live' : ''}`}
      title={isLive ? 'Данные загружены из MOEX CCI API' : 'Демонстрационные mock-данные'}
    >
      {isLive ? 'MOEX Live' : 'Mock'}
    </span>
  )
}
