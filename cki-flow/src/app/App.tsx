import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/app/layouts/AppShell'
import { BacklogPage } from '@/pages/backlog/ui/BacklogPage'
import { LoadPage } from '@/pages/load/ui/LoadPage'
import {
  AnalyticsPage,
  BoardPage,
  QuarterPage,
  ReleasesPage,
  RisksPage,
  RoadmapPage,
  SettingsPage,
} from '@/pages/placeholders'
import { SprintPage } from '@/pages/sprint/ui/SprintPage'
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
        <Route path="system/templates" element={<TemplatesPage />} />
        <Route path="system/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
