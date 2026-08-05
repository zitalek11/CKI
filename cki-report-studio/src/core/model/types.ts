export type ReportStatus = 'draft' | 'ready' | 'exported'
export type MetricCategory = 'base' | 'activity' | 'retention' | 'monetization'
export type MetricFormat = 'number' | 'currency' | 'percent' | 'thousands'
export type AccentTone = 'cyan' | 'purple' | 'green' | 'amber' | 'red' | 'muted'
export type RoadmapStatus = 'done' | 'current' | 'planned' | 'future'
export type ActivityRole = 'CLIENTS' | 'FRONT' | 'BACK' | 'ADMIN'
export type DeltaTone = 'up' | 'down' | 'flat'

export interface ReportMeta {
  id: string
  weekNumber: number
  reportDate: string
  previousReportId?: string
  status: ReportStatus
  schemaVersion: number
  notes?: string
  createdAt?: string
  updatedAt?: string
  author?: string
}

export interface BrandPillar {
  title: string
  caption: string
  tone: AccentTone
}

export interface GeneralSection {
  title: string
  subtitle: string
  brandTag: string
  pillars: BrandPillar[]
}

export interface Goals2026 {
  revenueYear: number
  revenueMonthly: number
  clients: number
  subscriptions: number
  coverage: number
}

export interface ValueProp {
  title: string
  description: string
}

export interface ProductsSection {
  items: string[]
  highlight: { label: string; tone: AccentTone }
  valueProps: {
    external: ValueProp[]
    internal: ValueProp[]
    strategy: ValueProp[]
  }
}

export interface MetricCard {
  id: string
  label: string
  category: MetricCategory
  value: number
  unit: string
  goalKey?: keyof Goals2026
  format: MetricFormat
  compareWithPrevious: boolean
  accent: AccentTone
}

export interface FunnelStage {
  id: string
  label: string
  count: number
  amountThousands: number
  highlight?: 'amber' | 'green'
}

export interface FunnelComment {
  id: string
  tone: AccentTone
  text: string
}

export interface FunnelSection {
  stages: FunnelStage[]
  comments: FunnelComment[]
}

export interface RoadmapItem {
  id: string
  period: string
  status: RoadmapStatus
  description: string
}

export interface ActivityRow {
  role: ActivityRole
  cells: string[]
}

export interface ActivitiesSection {
  weekDates: string[]
  rows: ActivityRow[]
}

export interface TeamDynamicsPoint {
  fte: number
  costThousands: number
}

export interface OrgUnit {
  id: string
  title: string
  fte: number
  accent: AccentTone
  members: string[]
}

export interface TeamSection {
  fteTotal: number
  fteStaff: number
  fteContract: number
  fteNrd: number
  fteMb: number
  dynamics: {
    before: TeamDynamicsPoint
    after: TeamDynamicsPoint
  }
  orgUnits: OrgUnit[]
}

export interface ChartSeries {
  id: string
  title: string
  unit: string
  yMax: number
  color: string
  plan: number[]
  fact: number[]
}

export type TickerItem =
  | { type: 'static'; text: string }
  | { type: 'binding'; template: string }

export interface TickerConfig {
  slides: {
    title: TickerItem[]
    closing: TickerItem[]
  }
}

export interface WeeklyReport {
  meta: ReportMeta
  general: GeneralSection
  goals: Goals2026
  products: ProductsSection
  metrics: MetricCard[]
  funnel: FunnelSection
  roadmap: RoadmapItem[]
  activities: ActivitiesSection
  team: TeamSection
  charts: ChartSeries[]
  ticker: TickerConfig
}

export interface DerivedMetric extends MetricCard {
  delta: number | null
  deltaLabel: string
  tone: DeltaTone
  progressPercent: number | null
  progressWidth: number | null
  displayValue: string
  goalValue: number | null
}

export interface DerivedFunnelStage extends FunnelStage {
  weeklyDelta: number | null
  weeklyDeltaLabel: string
  barWidth: number
  tone: DeltaTone
}

export interface DerivedTeam {
  staffPercent: number
  contractPercent: number
  monthlyCostMillions: string
  deltaFte: number
  deltaCost: number
  deltaFtePercent: number
  deltaCostPercent: number
  deltaFteLabel: string
  deltaCostLabel: string
  deltaFteTone: DeltaTone
  deltaCostTone: DeltaTone
}

export interface ReportViewModel {
  report: WeeklyReport
  formattedDate: string
  slideCount: number
  metrics: DerivedMetric[]
  funnel: {
    stages: DerivedFunnelStage[]
    totalCount: number
    totalAmount: number
    totalDelta: number
    totalDeltaLabel: string
    comments: FunnelComment[]
  }
  team: DerivedTeam
  chartsJson: string
  titleTicker: string[]
  closingTicker: string[]
}
