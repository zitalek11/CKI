import { StoryStatus, type StoryStatus as StoryStatusType } from '@/domain/model/enums'
import { DomainError } from '@/domain/model/errors'

const STORY_TRANSITIONS: Record<StoryStatusType, StoryStatusType[]> = {
  [StoryStatus.Draft]: [StoryStatus.Refining, StoryStatus.Cancelled],
  [StoryStatus.Refining]: [StoryStatus.Ready, StoryStatus.Draft, StoryStatus.Cancelled],
  [StoryStatus.Ready]: [StoryStatus.Planned, StoryStatus.InProgress, StoryStatus.Refining, StoryStatus.Cancelled],
  [StoryStatus.Planned]: [StoryStatus.InProgress, StoryStatus.Ready, StoryStatus.Cancelled],
  [StoryStatus.InProgress]: [StoryStatus.InReview, StoryStatus.Done, StoryStatus.Cancelled],
  [StoryStatus.InReview]: [StoryStatus.Done, StoryStatus.InProgress, StoryStatus.Cancelled],
  [StoryStatus.Done]: [StoryStatus.InProgress, StoryStatus.Archived],
  [StoryStatus.Cancelled]: [StoryStatus.Archived, StoryStatus.Draft],
  [StoryStatus.Archived]: [],
}

export const BOARD_COLUMNS: StoryStatusType[] = [
  StoryStatus.Draft,
  StoryStatus.Refining,
  StoryStatus.Ready,
  StoryStatus.Planned,
  StoryStatus.InProgress,
  StoryStatus.InReview,
  StoryStatus.Done,
]

export function canTransitionStory(from: StoryStatusType, to: StoryStatusType): boolean {
  if (from === to) return true
  return STORY_TRANSITIONS[from]?.includes(to) ?? false
}

export function assertStoryTransition(from: StoryStatusType, to: StoryStatusType): void {
  if (!canTransitionStory(from, to)) {
    throw new DomainError('INVARIANT', `Cannot transition story from ${from} to ${to}`)
  }
}
