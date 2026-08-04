export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  hasMore: boolean
}

export interface PaginatedResult<T> {
  items: T[]
  pagination: PaginationMeta
}

export function emptyPagination(pageSize = 0): PaginationMeta {
  return { page: 1, pageSize, total: 0, hasMore: false }
}

export function buildPagination(page: number, pageSize: number, total: number): PaginationMeta {
  const safePageSize = Math.max(pageSize, 1)
  const loaded = Math.min(page * safePageSize, total)
  return {
    page,
    pageSize: safePageSize,
    total,
    hasMore: loaded < total,
  }
}
