import {
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { AppLayout } from '../layouts/AppLayout'
import { DashboardPage } from '../pages/dashboard/DashboardPage'
import { CopilotPage } from '../pages/copilot/CopilotPage'
import { CompaniesPage } from '../pages/companies/CompaniesPage'
import { CompanyProfilePage } from '../pages/company/CompanyProfilePage'
import { AnalyticsPage } from '../pages/analytics/AnalyticsPage'
import { CorporateActionsPage } from '../pages/actions/CorporateActionsPage'
import { APIExplorerPage } from '../pages/api/APIExplorerPage'

const rootRoute = createRootRoute({
  component: AppLayout,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPage,
})

const askRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/ask',
  component: CopilotPage,
})

const companiesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/companies',
  component: CompaniesPage,
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === 'string' ? search.q : undefined,
  }),
})

const companyProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/companies/$id',
  component: CompanyProfilePage,
})

const analyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/analytics/banks',
  component: AnalyticsPage,
  validateSearch: (search: Record<string, unknown>) => ({
    compareIds: Array.isArray(search.compareIds)
      ? search.compareIds.filter((id): id is string => typeof id === 'string')
      : undefined,
  }),
})

const corporateActionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/corporate-actions',
  component: CorporateActionsPage,
})

const apiExplorerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/api-explorer',
  component: APIExplorerPage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  askRoute,
  companiesRoute,
  companyProfileRoute,
  analyticsRoute,
  corporateActionsRoute,
  apiExplorerRoute,
])

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
