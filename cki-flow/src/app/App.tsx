import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/app/layouts/AppShell'
import { AnalyticsPage } from '@/pages/analytics/ui/AnalyticsPage'
import { BacklogPage } from '@/pages/backlog/ui/BacklogPage'
import { BoardPage } from '@/pages/board/ui/BoardPage'
import { LoadPage } from '@/pages/load/ui/LoadPage'
import { MigrationPage } from '@/pages/migration/ui/MigrationPage'
import { QuarterPage } from '@/pages/quarter/ui/QuarterPage'
import { ReleasesPage } from '@/pages/releases/ui/ReleasesPage'
import { RisksPage } from '@/pages/risks/ui/RisksPage'
import { RoadmapPage } from '@/pages/roadmap/ui/RoadmapPage'
import { SettingsPage } from '@/pages/settings/ui/SettingsPage'
import { SprintPage } from '@/pages/sprint/ui/SprintPage'
import { TeamPage } from '@/pages/team/ui/TeamPage'
import { TemplatesPage } from '@/pages/templates/ui/TemplatesPage'
import { TodayPage } from '@/pages/today/ui/TodayPage'

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<TodayPage />} />
        <Route path="plan/quarter" element={<QuarterPage />} />
        <Route path="plan/sprint" element={<SprintPage />} />
        <Route path="deliver/backlog" element={<BacklogPage />} />
        <Route path="deliver/board" element={<BoardPage />} />
        <Route path="deliver/roadmap" element={<RoadmapPage />} />
        <Route path="deliver/releases" element={<ReleasesPage />} />
        <Route path="insights/load" element={<LoadPage />} />
        <Route path="insights/risks" element={<RisksPage />} />
        <Route path="insights/analytics" element={<AnalyticsPage />} />
        <Route path="system/team" element={<TeamPage />} />
        <Route path="system/templates" element={<TemplatesPage />} />
        <Route path="system/migration" element={<MigrationPage />} />
        <Route path="system/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
