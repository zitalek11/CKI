import { wouldCreateCycle } from '@/domain/engines/dependency/cycle'
import type { ImportDraft, ImportIssue, ValidationReport } from '@/domain/migration/types'

export function validateImportDraft(draft: ImportDraft): ValidationReport {
  const issues: ImportIssue[] = []

  if (draft.stories.length === 0) {
    issues.push({
      severity: 'error',
      code: 'NO_STORIES',
      message: 'Не найдено ни одной User Story для импорта',
    })
  }

  const storyKeys = new Map<string, string>()
  for (const story of draft.stories) {
    if (!story.title.trim()) {
      issues.push({
        severity: 'error',
        code: 'STORY_TITLE',
        message: 'User Story без названия',
        targetTempId: story.tempId,
      })
    }
    if (story.key) {
      const prev = storyKeys.get(story.key)
      if (prev) {
        issues.push({
          severity: 'error',
          code: 'DUPLICATE_STORY_KEY',
          message: `Дубликат ключа Story: ${story.key}`,
          targetTempId: story.tempId,
        })
      } else {
        storyKeys.set(story.key, story.tempId)
      }
    }
    if (!story.sprintName) {
      issues.push({
        severity: 'warning',
        code: 'STORY_NO_SPRINT',
        message: `У «${story.title}» не определён Sprint`,
        targetTempId: story.tempId,
      })
    }
    if (!story.ownerName && (!story.assigneeHints || story.assigneeHints.length === 0)) {
      issues.push({
        severity: 'warning',
        code: 'STORY_NO_OWNER',
        message: `У «${story.title}» нет ответственного`,
        targetTempId: story.tempId,
      })
    }
    if (story.needsReview) {
      issues.push({
        severity: 'warning',
        code: 'STORY_REVIEW',
        message: story.reviewReason ?? `«${story.title}» требует проверки`,
        targetTempId: story.tempId,
      })
    }
  }

  for (const sprint of draft.sprints) {
    if (sprint.startDate > sprint.endDate) {
      issues.push({
        severity: 'error',
        code: 'SPRINT_DATES',
        message: `Некорректные даты спринта ${sprint.name}`,
        targetTempId: sprint.tempId,
      })
    }
  }

  for (const dep of draft.dependencies) {
    if (dep.unresolved || dep.needsReview) {
      issues.push({
        severity: 'warning',
        code: 'DEP_UNRESOLVED',
        message: dep.reviewReason ?? 'Зависимость требует подтверждения',
        targetTempId: dep.tempId,
      })
    }
  }

  const edges = draft.dependencies
    .filter((dep) => dep.fromStoryKey && dep.toStoryKey && !dep.unresolved)
    .map((dep) => ({ fromId: dep.fromStoryKey!, toId: dep.toStoryKey! }))

  for (const edge of edges) {
    const others = edges.filter((item) => item !== edge)
    if (wouldCreateCycle(others, edge.fromId, edge.toId)) {
      issues.push({
        severity: 'error',
        code: 'DEP_CYCLE',
        message: `Циклическая зависимость: ${edge.fromId} → ${edge.toId}`,
      })
    }
  }

  const ok = !issues.some((issue) => issue.severity === 'error')
  return { ok, issues }
}
