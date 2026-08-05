import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/app/layouts/AppShell'
import {
  AnalyticsPage,
  BacklogPage,
  BoardPage,
  LoadPage,
  QuarterPage,
  ReleasesPage,
  RisksPage,
  RoadmapPage,
  SettingsPage,
  SprintPage,
  TemplatesPage,
} from '@/pages/placeholders'
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
