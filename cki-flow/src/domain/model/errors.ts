export type DomainErrorCode =
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INVARIANT'
  | 'FORBIDDEN'
  | 'PRECONDITION'

export class DomainError extends Error {
  readonly code: DomainErrorCode
  readonly details?: unknown

  constructor(code: DomainErrorCode, message: string, details?: unknown) {
    super(message)
    this.name = 'DomainError'
    this.code = code
    this.details = details
  }
}

export function assertDomain(condition: unknown, message: string, details?: unknown): asserts condition {
  if (!condition) {
    throw new DomainError('INVARIANT', message, details)
  }
}
