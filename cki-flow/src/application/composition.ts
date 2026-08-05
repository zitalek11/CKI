import { AnalyticsService } from '@/application/services/analytics-service'
import { BoardService } from '@/application/services/board-service'
import { BootstrapService } from '@/application/services/bootstrap-service'
import { CatalogService } from '@/application/services/catalog-service'
import { IoService } from '@/application/services/io-service'
import { QuarterService } from '@/application/services/quarter-service'
import { ReleaseService } from '@/application/services/release-service'
import { RoadmapService } from '@/application/services/roadmap-service'
import { SprintService } from '@/application/services/sprint-service'
import { StoryService } from '@/application/services/story-service'
import { LocalStorageAdapter } from '@/infrastructure/storage/local-storage-adapter'
import { LocalUnitOfWork } from '@/infrastructure/repositories/local-unit-of-work'

const storage = new LocalStorageAdapter()
const uow = new LocalUnitOfWork(storage)

export const appServices = {
  uow,
  bootstrap: new BootstrapService(uow),
  stories: new StoryService(uow),
  catalog: new CatalogService(uow),
  sprints: new SprintService(uow),
  quarters: new QuarterService(uow),
  board: new BoardService(uow),
  releases: new ReleaseService(uow),
  roadmap: new RoadmapService(uow),
  analytics: new AnalyticsService(uow),
  io: new IoService(uow),
}

export type AppServices = typeof appServices
