import type { AnalysisSummary, ImportDraft } from '@/domain/migration/types'

export function summarizeDraft(draft: ImportDraft): AnalysisSummary {
  const needsReview =
    draft.stories.filter((item) => item.needsReview).length +
    draft.dependencies.filter((item) => item.needsReview || item.unresolved).length +
    draft.people.filter((item) => item.needsReview).length

  return {
    quarters: draft.quarters.length,
    sprints: draft.sprints.length,
    stories: draft.stories.length,
    epics: draft.epics.length,
    initiatives: draft.initiatives.length,
    people: draft.people.length,
    dependencies: draft.dependencies.length,
    releases: draft.releases.length,
    needsReview,
  }
}
