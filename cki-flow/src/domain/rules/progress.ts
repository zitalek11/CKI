import type { UserStory, WorkItem } from '@/domain/model/entities'
import { WorkItemStatus } from '@/domain/model/enums'

const TERMINAL_DONE = new Set<string>([WorkItemStatus.Done])
const TERMINAL_ANY = new Set<string>([WorkItemStatus.Done, WorkItemStatus.Cancelled])

export function calculateStoryProgress(workItems: WorkItem[]): number {
  const mandatory = workItems.filter((item) => item.isMandatory && item.status !== WorkItemStatus.Cancelled)
  if (mandatory.length === 0) {
    const all = workItems.filter((item) => item.status !== WorkItemStatus.Cancelled)
    if (all.length === 0) return 0
    const done = all.filter((item) => TERMINAL_DONE.has(item.status)).length
    return Math.round((done / all.length) * 100)
  }

  const done = mandatory.filter((item) => TERMINAL_DONE.has(item.status)).length
  return Math.round((done / mandatory.length) * 100)
}

export function canCompleteStory(story: UserStory, workItems: WorkItem[]): boolean {
  if (story.status === 'cancelled' || story.status === 'archived') return false
  const storyItems = workItems.filter((item) => item.userStoryId === story.id)
  const mandatoryOpen = storyItems.some(
    (item) => item.isMandatory && !TERMINAL_ANY.has(item.status),
  )
  return !mandatoryOpen
}

export function sumRemainingRoleHours(workItems: WorkItem[]): number {
  return workItems
    .filter((item) => !TERMINAL_ANY.has(item.status))
    .reduce((sum, item) => sum + item.estimateHours, 0)
}
