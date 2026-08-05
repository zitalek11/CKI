import { Outlet } from 'react-router-dom'
import { CommandPalette } from '@/features/command-palette/ui/CommandPalette'
import { StoryPeekDrawer } from '@/features/story-peek/ui/StoryPeekDrawer'
import { AppBreadcrumbs } from '@/widgets/breadcrumbs/ui/AppBreadcrumbs'
import { RecentObjects } from '@/widgets/recents/ui/RecentObjects'
import { AppSidebar } from '@/widgets/sidebar/ui/AppSidebar'
import { AppTopbar } from '@/widgets/topbar/ui/AppTopbar'

export function AppShell() {
  return (
    <div className="flex h-full min-h-0 bg-[var(--color-bg-app)] text-[var(--color-text-primary)]">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar />
        <AppBreadcrumbs />
        <RecentObjects />
        <main className="min-h-0 flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
      <CommandPalette />
      <StoryPeekDrawer />
    </div>
  )
}
