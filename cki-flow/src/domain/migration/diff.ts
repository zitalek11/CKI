import type { DomainDatabase } from '@/domain/model/database'
import type { ImportDraft, UpdateDiffItem } from '@/domain/migration/types'
import type { UUID } from '@/domain/model/ids'

/** Build update diffs of draft against an existing product database. */
export function buildUpdateDiff(
  draft: ImportDraft,
  db: DomainDatabase,
  productId: UUID,
): UpdateDiffItem[] {
  const diffs: UpdateDiffItem[] = []
  const stories = db.userStories.filter((item) => item.productId === productId)
  const byKey = new Map(stories.map((item) => [item.key, item]))
  const byTitle = new Map(stories.map((item) => [item.title.trim().toLowerCase(), item]))

  for (const draftStory of draft.stories) {
    const existing =
      (draftStory.key ? byKey.get(draftStory.key) : undefined) ??
      byTitle.get(draftStory.title.trim().toLowerCase())

    if (!existing) {
      diffs.push({
        entityType: 'user_story',
        key: draftStory.key ?? draftStory.title,
        field: 'exists',
        before: '—',
        after: 'новая User Story',
      })
      continue
    }

    if (draftStory.status && draftStory.status !== existing.status) {
      diffs.push({
        entityType: 'user_story',
        key: existing.key,
        field: 'status',
        before: existing.status,
        after: draftStory.status,
      })
    }

    if (
      draftStory.storyPoints !== undefined &&
      draftStory.storyPoints !== existing.storyPoints
    ) {
      diffs.push({
        entityType: 'user_story',
        key: existing.key,
        field: 'storyPoints',
        before: String(existing.storyPoints ?? '—'),
        after: String(draftStory.storyPoints),
      })
    }

    if (draftStory.title.trim() !== existing.title.trim()) {
      diffs.push({
        entityType: 'user_story',
        key: existing.key,
        field: 'title',
        before: existing.title,
        after: draftStory.title,
      })
    }
  }

  const epicKeys = new Set(
    db.epics.filter((item) => item.productId === productId).map((item) => item.key),
  )
  for (const epic of draft.epics) {
    if (!epicKeys.has(epic.key)) {
      diffs.push({
        entityType: 'epic',
        key: epic.key,
        field: 'exists',
        before: '—',
        after: 'новый Epic',
      })
    }
  }

  const sprintNames = new Set(
    db.sprints.filter((item) => item.productId === productId).map((item) => item.name),
  )
  for (const sprint of draft.sprints) {
    if (!sprintNames.has(sprint.name)) {
      diffs.push({
        entityType: 'sprint',
        key: sprint.name,
        field: 'exists',
        before: '—',
        after: 'новый Sprint',
      })
    }
  }

  const people = new Set(
    db.employees
      .filter((item) => item.productId === productId)
      .map((item) => item.displayName.trim().toLowerCase()),
  )
  for (const person of draft.people) {
    if (!people.has(person.displayName.trim().toLowerCase())) {
      diffs.push({
        entityType: 'employee',
        key: person.displayName,
        field: 'exists',
        before: '—',
        after: 'новый участник',
      })
    }
  }

  return diffs
}
