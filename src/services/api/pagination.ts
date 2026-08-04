import type { AxiosInstance } from 'axios'
import type { IssTableBlock } from './issTable'
import { parseIssTable } from './issTable'
import type { MoexNewApiListResponse } from './moexTypes'
import { buildPagination, type PaginationMeta } from './types'

export interface IssCursorRow {
  INDEX: number
  TOTAL: number
  PAGESIZE: number
}

export function parseIssCursor(block?: IssTableBlock): PaginationMeta | null {
  if (!block?.columns?.length || !block.data?.length) return null
  const row = block.data[0]
  const cursor: Record<string, number> = {}
  block.columns.forEach((column, index) => {
    cursor[column] = Number(row[index] ?? 0)
  })
  const index = cursor.INDEX ?? 0
  const total = cursor.TOTAL ?? 0
  const pageSize = cursor.PAGESIZE ?? 0
  const page = pageSize > 0 ? Math.floor(index / pageSize) + 1 : 1
  return buildPagination(page, pageSize, total)
}

export function parseNewApiCursor(
  cursor?: MoexNewApiListResponse<unknown>['cursor'],
  itemsOnPage = 0,
): PaginationMeta {
  const total = cursor?.total ?? itemsOnPage
  const pageSize = cursor?.limit ?? itemsOnPage
  const page = cursor?.page ?? 1
  return buildPagination(page, pageSize, total)
}

export type FetchAllOptions = {
  pageSize?: number
  maxPages?: number
  maxItems?: number
}

const DEFAULT_FETCH_ALL: Required<FetchAllOptions> = {
  pageSize: 1000,
  maxPages: 200,
  maxItems: 200_000,
}

/** Fetch every page from the new CCI API list endpoint. */
export async function fetchAllNewApiPages<T>(
  client: AxiosInstance,
  path: string,
  baseParams: Record<string, unknown> = {},
  options: FetchAllOptions = {},
): Promise<{ items: T[]; pagination: PaginationMeta }> {
  const { pageSize, maxPages, maxItems } = { ...DEFAULT_FETCH_ALL, ...options }
  const items: T[] = []
  let page = 1
  let total = 0

  while (page <= maxPages && items.length < maxItems) {
    const { data } = await client.get<MoexNewApiListResponse<T>>(path, {
      params: { ...baseParams, page, limit: pageSize },
    })
    const batch = data.data ?? []
    if (!batch.length) break

    items.push(...batch)
    total = data.cursor?.total ?? items.length

    const pagination = parseNewApiCursor(data.cursor, batch.length)
    if (!pagination.hasMore || items.length >= total) break
    page += 1
  }

  return {
    items: items.slice(0, maxItems),
    pagination: buildPagination(1, items.length, total || items.length),
  }
}

/** Fetch every page from a legacy ISS table endpoint (start/limit offset). */
export async function fetchAllIssTablePages<T extends object>(
  client: AxiosInstance,
  path: string,
  tableKey: string,
  baseParams: Record<string, unknown> = {},
  options: FetchAllOptions = {},
): Promise<{ items: T[]; pagination: PaginationMeta }> {
  const { pageSize, maxPages, maxItems } = { ...DEFAULT_FETCH_ALL, ...options }
  const items: T[] = []
  let start = 0
  let total = 0
  let page = 1

  while (page <= maxPages && items.length < maxItems) {
    const { data } = await client.get(path, {
      params: { ...baseParams, limit: pageSize, start },
    })

    const table = data?.[tableKey] as IssTableBlock | undefined
    const batch = parseIssTable<T>(table)
    if (!batch.length) break

    items.push(...batch)

    const cursorBlock = data?.[`${tableKey}.cursor`] as IssTableBlock | undefined
    const cursor = parseIssCursor(cursorBlock)
    total = cursor?.total ?? items.length

    if (!cursor || !cursor.hasMore || items.length >= total) break
    start += pageSize
    page += 1
  }

  return {
    items: items.slice(0, maxItems),
    pagination: buildPagination(1, items.length, total || items.length),
  }
}
