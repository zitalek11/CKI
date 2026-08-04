export interface IssTableBlock {
  columns?: string[]
  data?: Array<Array<string | number | null>>
}

export function parseIssTable<T extends object>(block?: IssTableBlock): T[] {
  if (!block?.columns?.length || !block.data?.length) return []

  return block.data.map((row) => {
    const item: Record<string, unknown> = {}
    block.columns!.forEach((column, index) => {
      item[column] = row[index]
    })
    return item as T
  })
}

export async function readMoexJson<T>(response: Response): Promise<T> {
  const raw = await response.text()
  const normalized = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw
  return JSON.parse(normalized) as T
}
