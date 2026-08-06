import type { UUID } from '@/domain/model/ids'

export type IsoDateTime = string
export type IsoDate = string

export type SystemFields = {
  createdAt: IsoDateTime
  updatedAt: IsoDateTime
  createdBy: string
  updatedBy: string
  archivedAt?: IsoDateTime
}

export function touchSystemFields(
  existing: SystemFields | undefined,
  actor: string,
  now: IsoDateTime = new Date().toISOString(),
): SystemFields {
  if (!existing) {
    return {
      createdAt: now,
      updatedAt: now,
      createdBy: actor,
      updatedBy: actor,
    }
  }

  return {
    ...existing,
    updatedAt: now,
    updatedBy: actor,
  }
}

export type EntityRef = {
  type: string
  id: UUID
}
