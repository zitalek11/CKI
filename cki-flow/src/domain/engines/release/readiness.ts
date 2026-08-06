import type { ReleaseMembership, UserStory, WorkItem } from '@/domain/model/entities'
import { ReleaseInclusion, StoryStatus, WorkItemStatus } from '@/domain/model/enums'

export type ReleaseGateResult = {
  key: string
  label: string
  hard: boolean
  passed: boolean
  detail: string
}

export type ReleaseReadiness = {
  completionPercent: number
  readinessPercent: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  gates: ReleaseGateResult[]
}

const INCLUSION_WEIGHT: Record<string, number> = {
  [ReleaseInclusion.Must]: 1,
  [ReleaseInclusion.Should]: 0.6,
  [ReleaseInclusion.Stretch]: 0.3,
}

export function calculateReleaseReadiness(params: {
  memberships: ReleaseMembership[]
  stories: UserStory[]
  workItems: WorkItem[]
}): ReleaseReadiness {
  const storyById = new Map(params.stories.map((story) => [story.id, story]))
  const activeMemberships = params.memberships.filter((item) => !item.waived)

  let scopeWeight = 0
  let doneWeight = 0
  let mustIncomplete = 0
  let openQa = 0
  let openBlockers = 0

  for (const membership of activeMemberships) {
    const weight = INCLUSION_WEIGHT[membership.inclusion] ?? 0.5
    scopeWeight += weight
    const story = storyById.get(membership.userStoryId)
    if (!story) continue

    if (story.status === StoryStatus.Done) {
      doneWeight += weight
    } else if (membership.inclusion === ReleaseInclusion.Must) {
      mustIncomplete += 1
    }

    const works = params.workItems.filter((item) => item.userStoryId === story.id)
    openQa += works.filter(
      (item) =>
        item.workflowStageKey === 'QA' &&
        item.status !== WorkItemStatus.Done &&
        item.status !== WorkItemStatus.Cancelled,
    ).length
    openBlockers += works.filter((item) => item.status === WorkItemStatus.Blocked).length
  }

  const completionPercent = scopeWeight === 0 ? 0 : Math.round((doneWeight / scopeWeight) * 100)

  const gates: ReleaseGateResult[] = [
    {
      key: 'G_SCOPE',
      label: 'Обязательный scope закрыт',
      hard: true,
      passed: mustIncomplete === 0,
      detail:
        mustIncomplete === 0
          ? 'Все must-Story завершены или исключены'
          : `Открыто must-Story: ${mustIncomplete}`,
    },
    {
      key: 'G_QUALITY',
      label: 'Этапы QA закрыты',
      hard: true,
      passed: openQa === 0,
      detail: openQa === 0 ? 'Нет открытых QA-задач' : `Открытых QA-задач: ${openQa}`,
    },
    {
      key: 'G_DEPS',
      label: 'Нет заблокированных работ',
      hard: true,
      passed: openBlockers === 0,
      detail:
        openBlockers === 0
          ? 'Блокеров нет'
          : `Заблокированных задач: ${openBlockers}`,
    },
  ]

  const hardPassed = gates.filter((gate) => gate.hard && gate.passed).length
  const hardTotal = gates.filter((gate) => gate.hard).length
  const readinessPercent = Math.round(((hardPassed / Math.max(hardTotal, 1)) * 0.7 + completionPercent / 100 * 0.3) * 100)

  let riskLevel: ReleaseReadiness['riskLevel'] = 'low'
  if (readinessPercent < 40 || mustIncomplete > 2) riskLevel = 'critical'
  else if (readinessPercent < 70 || openBlockers > 0) riskLevel = 'high'
  else if (readinessPercent < 90) riskLevel = 'medium'

  return { completionPercent, readinessPercent, riskLevel, gates }
}
