import { DomainError } from '@/domain/model/errors'

export function formatStoryKey(productKey: string, sequence: number): string {
  if (sequence < 1) {
    throw new DomainError('VALIDATION', 'Story sequence must be >= 1')
  }
  return `${productKey}-${sequence}`
}

export function formatWorkItemKey(storyKey: string, stageKey: string): string {
  return `${storyKey}-${stageKey}`
}

export function formatQuarterKey(year: number, index: number): string {
  return `${year}-Q${index}`
}

export function nextFractionalRank(previous?: string, next?: string): string {
  if (!previous && !next) return 'a0'
  if (!previous && next) return beforeRank(next)
  if (previous && !next) return afterRank(previous)

  // Simple midpoint lexicographic strategy for MVP ranks.
  return `${previous}n`
}

function afterRank(rank: string): string {
  return `${rank}z`
}

function beforeRank(rank: string): string {
  return `a${rank}`
}
