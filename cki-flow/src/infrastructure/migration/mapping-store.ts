import type { MappingRule } from '@/domain/migration/types'

const STORAGE_KEY = 'cki-flow.migration.mapping-rules'

export function loadMappingRules(): MappingRule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as MappingRule[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveMappingRules(rules: MappingRule[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rules))
}

export function upsertMappingRule(rule: MappingRule): MappingRule[] {
  const rules = loadMappingRules().filter(
    (item) => !(item.kind === rule.kind && item.source.toLowerCase() === rule.source.toLowerCase()),
  )
  rules.push(rule)
  saveMappingRules(rules)
  return rules
}
