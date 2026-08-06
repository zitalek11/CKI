import type { ImportDraft, MappingRule } from '@/domain/migration/types'
import { StoryStatus, StoryType } from '@/domain/model/enums'

export type MappingRulesBundle = {
  rules: MappingRule[]
}

const DEFAULT_ROLE_MAP: Record<string, string> = {
  ба: 'BA',
  ba: 'BA',
  'бизнес-аналитик': 'BA',
  са: 'SA',
  sa: 'SA',
  'системный аналитик': 'SA',
  вр: 'BE',
  be: 'BE',
  backend: 'BE',
  'бэкенд': 'BE',
  fe: 'FE',
  фронт: 'FE',
  frontend: 'FE',
  qa: 'QA',
  тест: 'QA',
  pm: 'PM',
  'продакт': 'PM',
}

const DEFAULT_STATUS_MAP: Record<string, StoryStatus> = {
  backlog: StoryStatus.Ready,
  'к выполнению': StoryStatus.Ready,
  ready: StoryStatus.Ready,
  'в работе': StoryStatus.InProgress,
  doing: StoryStatus.InProgress,
  'in progress': StoryStatus.InProgress,
  review: StoryStatus.InReview,
  'на ревью': StoryStatus.InReview,
  done: StoryStatus.Done,
  'готово': StoryStatus.Done,
  'закрыто': StoryStatus.Done,
}

const DEFAULT_TYPE_MAP: Record<string, StoryType> = {
  api: StoryType.Feature,
  feature: StoryType.Feature,
  docs: StoryType.Documentation,
  documentation: StoryType.Documentation,
  doc: StoryType.Documentation,
  integration: StoryType.Integration,
  spike: StoryType.Spike,
  infra: StoryType.Infrastructure,
  bug: StoryType.Bugfix,
}

export function normalizeToken(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function resolveMappedValue(
  rules: MappingRule[],
  kind: MappingRule['kind'],
  source: string,
): string | undefined {
  const token = normalizeToken(source)
  const rule = rules.find((item) => item.kind === kind && normalizeToken(item.source) === token)
  return rule?.target
}

export function resolveRoleCode(source: string, rules: MappingRule[]): string | undefined {
  return resolveMappedValue(rules, 'role', source) ?? DEFAULT_ROLE_MAP[normalizeToken(source)]
}

export function resolveStoryStatus(source: string, rules: MappingRule[]): StoryStatus | undefined {
  const mapped = resolveMappedValue(rules, 'status', source)
  if (mapped && Object.values(StoryStatus).includes(mapped as StoryStatus)) {
    return mapped as StoryStatus
  }
  return DEFAULT_STATUS_MAP[normalizeToken(source)]
}

export function resolveStoryType(source: string, rules: MappingRule[]): StoryType | undefined {
  const mapped = resolveMappedValue(rules, 'work_type', source)
  if (mapped && Object.values(StoryType).includes(mapped as StoryType)) {
    return mapped as StoryType
  }
  return DEFAULT_TYPE_MAP[normalizeToken(source)]
}

export function createMappingRule(
  kind: MappingRule['kind'],
  source: string,
  target: string,
): MappingRule {
  return {
    id: crypto.randomUUID(),
    kind,
    source: source.trim(),
    target: target.trim(),
    createdAt: new Date().toISOString(),
  }
}

/** Enrich draft stories using saved + default mapping rules. */
export function applyMappingToDraft(
  draft: ImportDraft,
  bundle: MappingRulesBundle,
): ImportDraft {
  const rules = [...draft.mappingRules, ...bundle.rules]

  const stories = draft.stories.map((story) => {
    const next = { ...story }

    if (!next.status) {
      for (const hint of next.stageHints ?? []) {
        const status = resolveStoryStatus(hint, rules)
        if (status) {
          next.status = status
          break
        }
      }
    }

    if (!next.storyType && next.sourceHint) {
      next.storyType = resolveStoryType(next.sourceHint, rules)
    }

    if ((!next.assigneeHints || next.assigneeHints.length === 0) && next.ownerName) {
      const role = resolveRoleCode(next.ownerName, rules)
      if (role) next.assigneeHints = [role]
    } else if (next.assigneeHints) {
      next.assigneeHints = next.assigneeHints.map(
        (hint) => resolveRoleCode(hint, rules) ?? hint,
      )
    }

    const personMapped =
      next.ownerName && resolveMappedValue(rules, 'person', next.ownerName)
    if (personMapped) next.ownerName = personMapped

    return next
  })

  const people = draft.people.map((person) => {
    if (person.roleHint) {
      return {
        ...person,
        roleHint: resolveRoleCode(person.roleHint, rules) ?? person.roleHint,
      }
    }
    return person
  })

  return {
    ...draft,
    stories,
    people,
    mappingRules: rules,
  }
}
