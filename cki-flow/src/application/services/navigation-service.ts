import type { UnitOfWork } from '@/application/ports/unit-of-work'
import type { RecentObject } from '@/domain/model/entities'
import { createId } from '@/domain/model/ids'

const MAX_RECENTS = 12

export class NavigationService {
  private readonly uow: UnitOfWork

  constructor(uow: UnitOfWork) {
    this.uow = uow
  }

  async listRecents(productId: string): Promise<RecentObject[]> {
    const db = await this.uow.read()
    return db.recentObjects
      .filter((item) => item.productId === productId)
      .sort((a, b) => b.openedAt.localeCompare(a.openedAt))
      .slice(0, MAX_RECENTS)
  }

  async touch(params: {
    productId: string
    objectType: RecentObject['objectType']
    objectId: string
    label: string
    path: string
  }): Promise<void> {
    await this.uow.write((db) => {
      db.recentObjects = db.recentObjects.filter(
        (item) =>
          !(
            item.productId === params.productId &&
            item.objectType === params.objectType &&
            item.objectId === params.objectId
          ),
      )
      db.recentObjects.unshift({
        id: createId(),
        productId: params.productId as RecentObject['productId'],
        objectType: params.objectType,
        objectId: params.objectId as RecentObject['objectId'],
        label: params.label,
        path: params.path,
        openedAt: new Date().toISOString(),
      })
      db.recentObjects = db.recentObjects.slice(0, MAX_RECENTS * 2)
    })
  }
}
