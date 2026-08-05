import { BootstrapService } from '@/application/services/bootstrap-service'
import { CatalogService } from '@/application/services/catalog-service'
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
}

export type AppServices = typeof appServices
