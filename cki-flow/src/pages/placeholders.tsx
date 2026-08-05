import { PlaceholderPage } from '@/shared/ui/placeholder-page'

export function QuarterPage() {
  return (
    <PlaceholderPage
      title="Quarter"
      description="Goals, Initiatives, capacity envelope и health квартала."
      stageHint="Stage 10+"
    />
  )
}

export function SprintPage() {
  return (
    <PlaceholderPage
      title="Sprint"
      description="Commitment, role load, зависимости и риски текущего спринта."
      stageHint="Stage 10+"
    />
  )
}

export function BoardPage() {
  return (
    <PlaceholderPage
      title="Board"
      description="Kanban как проекция статусов Domain Model — не источник истины."
      stageHint="Stage 10+"
    />
  )
}

export function RoadmapPage() {
  return (
    <PlaceholderPage
      title="Roadmap"
      description="L0–L2 + режим Timeline. Позиции строятся из forecast автоматически."
      stageHint="Stage 10+"
    />
  )
}

export function ReleasesPage() {
  return (
    <PlaceholderPage
      title="Releases"
      description="Состав релиза, readiness gates, freeze и risk."
      stageHint="Stage 10+"
    />
  )
}

export function RisksPage() {
  return (
    <PlaceholderPage
      title="Risks"
      description="Реестр рисков, aging blockers и suggested actions."
      stageHint="Stage 10+"
    />
  )
}

export function AnalyticsPage() {
  return (
    <PlaceholderPage
      title="Analytics"
      description="One-minute pulse: health, velocity, bottleneck, release readiness."
      stageHint="Stage 11"
    />
  )
}

export function SettingsPage() {
  return (
    <PlaceholderPage
      title="Settings"
      description="Тема, плотность, команда, календари, статусы, импорт/экспорт."
      stageHint="Stage 12–13"
    />
  )
}
