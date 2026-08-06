import type { UnitOfWork } from '@/application/ports/unit-of-work'

export type RoadmapBar = {
  id: string
  kind: 'initiative' | 'epic' | 'story'
  label: string
  subtitle?: string
  start: string
  end: string
  status: string
  progress?: number
}

export class RoadmapService {
  private readonly uow: UnitOfWork

  constructor(uow: UnitOfWork) {
    this.uow = uow
  }

  async getBars(productId: string): Promise<{
    rangeStart: string
    rangeEnd: string
    bars: RoadmapBar[]
  }> {
    const db = await this.uow.read()
    const quarter = db.quarters.find((item) => item.productId === productId && item.status === 'active')
    const rangeStart = quarter?.startDate ?? '2026-07-01'
    const rangeEnd = quarter?.endDate ?? '2026-09-30'
    const bars: RoadmapBar[] = []

    for (const initiative of db.initiatives.filter((item) => item.productId === productId)) {
      const epicIds = db.epics.filter((epic) => epic.initiativeId === initiative.id).map((epic) => epic.id)
      const storyIds = db.userStories
        .filter((story) => story.initiativeId === initiative.id || (story.epicId && epicIds.includes(story.epicId)))
        .map((story) => story.id)
      const works = db.workItems.filter((item) => storyIds.includes(item.userStoryId))
      const starts = works.map((item) => item.forecastStart).filter(Boolean).sort() as string[]
      const ends = works.map((item) => item.forecastEnd).filter(Boolean).sort() as string[]
      bars.push({
        id: initiative.id,
        kind: 'initiative',
        label: initiative.title,
        subtitle: initiative.key,
        start: starts[0] ?? rangeStart,
        end: ends[ends.length - 1] ?? rangeEnd,
        status: initiative.status,
      })
    }

    for (const story of db.userStories.filter((item) => item.productId === productId)) {
      const works = db.workItems.filter((item) => item.userStoryId === story.id)
      const starts = works.map((item) => item.forecastStart).filter(Boolean).sort() as string[]
      const ends = works.map((item) => item.forecastEnd).filter(Boolean).sort() as string[]
      if (starts.length === 0) continue
      bars.push({
        id: story.id,
        kind: 'story',
        label: story.title,
        subtitle: story.key,
        start: starts[0]!,
        end: ends[ends.length - 1]!,
        status: story.status,
      })
    }

    return { rangeStart, rangeEnd, bars }
  }
}
