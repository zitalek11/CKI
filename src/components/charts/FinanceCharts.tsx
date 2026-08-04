import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const tooltipStyle = {
  background: 'rgba(2, 6, 23, 0.95)',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  borderRadius: 12,
  color: '#e2e8f0',
}

type ChartPoint = {
  label: string
  [key: string]: string | number | undefined
}

interface FinanceLineChartProps<T extends ChartPoint> {
  data: T[]
  dataKey: keyof T & string
  color?: string
  height?: number
}

export function FinanceLineChart<T extends ChartPoint>({
  data,
  dataKey,
  color = '#3b82f6',
  height = 260,
}: FinanceLineChartProps<T>) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.35} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
        <XAxis dataKey="label" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey={dataKey} stroke={color} fill={`url(#gradient-${dataKey})`} strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

interface FinanceBarChartProps<T extends ChartPoint> {
  data: T[]
  dataKey: keyof T & string
  color?: string
  height?: number
}

export function FinanceBarChart<T extends ChartPoint>({
  data,
  dataKey,
  color = '#22c55e',
  height = 260,
}: FinanceBarChartProps<T>) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
        <XAxis dataKey="label" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey={dataKey} fill={color} radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
