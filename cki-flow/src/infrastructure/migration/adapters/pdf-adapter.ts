import type { MigrationFileInput, MigrationSourceAdapter } from '@/application/migration/ports'
import type {
  DraftDependency,
  DraftEpic,
  DraftInitiative,
  DraftPerson,
  DraftQuarter,
  DraftSprint,
  DraftStory,
  ImportDraft,
} from '@/domain/migration/types'
import { StoryType } from '@/domain/model/enums'

/**
 * Heuristic PDF adapter for ЦКИ board dumps.
 * Extracts text via pdf.js and looks for quarters, sprints, story keys, owners.
 * Low-confidence items are flagged for review — never silently invented as facts.
 */
export class PdfBoardAdapter implements MigrationSourceAdapter {
  readonly format = 'pdf' as const

  canHandle(input: MigrationFileInput): boolean {
    const name = input.fileName.toLowerCase()
    return name.endsWith('.pdf') || input.mimeType.includes('pdf')
  }

  async parse(input: MigrationFileInput): Promise<ImportDraft> {
    const text = await extractPdfText(input.bytes)
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)

    const notes: string[] = [
      'PDF-распознавание эвристическое: проверьте результат на шаге Review.',
    ]

    const quarters = findQuarters(lines)
    const sprints = findSprints(lines, quarters[0]?.key)
    const people = findPeople(lines)
    const { stories, epics, initiatives } = findWorkItems(lines, quarters[0]?.key, sprints[0]?.name)
    const dependencies = findDependencies(lines, stories)

    if (stories.length === 0) {
      notes.push(
        'Не удалось надёжно извлечь User Story из PDF. Рекомендуется экспорт в JSON (cki-board-export) или ручная правка на шаге Review.',
      )
    }

    return {
      sourceFormat: 'pdf',
      sourceFileName: input.fileName,
      analyzedAt: new Date().toISOString(),
      people,
      quarters,
      sprints,
      initiatives,
      epics,
      stories,
      dependencies,
      releases: [],
      mappingRules: [],
      rawNotes: notes,
    }
  }
}

async function extractPdfText(bytes: ArrayBuffer): Promise<string> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  // Disable worker in heuristic adapter — fine for board PDFs and Vitest.
  ;(pdfjs as { GlobalWorkerOptions: { workerSrc: string } }).GlobalWorkerOptions.workerSrc = ''

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(bytes),
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
  })
  const doc = await loadingTask.promise
  const chunks: string[] = []
  for (let pageNo = 1; pageNo <= doc.numPages; pageNo += 1) {
    const page = await doc.getPage(pageNo)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
    chunks.push(pageText)
  }
  return chunks.join('\n')
}

function tempId(): string {
  return crypto.randomUUID()
}

function findQuarters(lines: string[]): DraftQuarter[] {
  const found = new Map<string, DraftQuarter>()
  const re = /\b(20\d{2})\s*[-/]?\s*Q([1-4])\b/gi
  const joined = lines.join('\n')
  for (const match of joined.matchAll(re)) {
    const year = Number(match[1])
    const index = Number(match[2]) as 1 | 2 | 3 | 4
    const key = `${year}-Q${index}`
    if (found.has(key)) continue
    const starts = ['01-01', '04-01', '07-01', '10-01'] as const
    const ends = ['03-31', '06-30', '09-30', '12-31'] as const
    found.set(key, {
      tempId: tempId(),
      confidence: 'medium',
      key,
      year,
      index,
      startDate: `${year}-${starts[index - 1]}`,
      endDate: `${year}-${ends[index - 1]}`,
      sourceHint: match[0],
    })
  }
  return [...found.values()]
}

function findSprints(lines: string[], quarterKey?: string): DraftSprint[] {
  const found = new Map<string, DraftSprint>()
  const re = /\b(?:Sprint|Спринт)\s*[:\-]?\s*(\d{1,2}|[A-Za-zА-Яа-я0-9._-]{2,20})\b/gi
  const joined = lines.join('\n')
  let ordinal = 0
  for (const match of joined.matchAll(re)) {
    const name = `Sprint ${match[1]}`
    if (found.has(name)) continue
    ordinal += 1
    const start = new Date(Date.UTC(2026, 0, 1 + (ordinal - 1) * 14))
    const end = new Date(start)
    end.setUTCDate(end.getUTCDate() + 13)
    found.set(name, {
      tempId: tempId(),
      confidence: 'medium',
      name,
      quarterKey,
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      needsReview: true,
      reviewReason: 'Даты спринта выведены эвристически из PDF',
      sourceHint: match[0],
    })
  }
  return [...found.values()]
}

function findPeople(lines: string[]): DraftPerson[] {
  const names = new Set<string>()
  const roleCodes = /\b(БА|СА|ВР|BE|FE|QA|BA|SA|PM)\b/g
  for (const line of lines) {
    for (const match of line.matchAll(roleCodes)) {
      names.add(match[1])
    }
    const owner = line.match(/(?:Ответственный|Owner|Assignee)\s*[:\-]\s*(.+)$/i)
    if (owner?.[1]) names.add(owner[1].trim())
  }
  return [...names].map((displayName) => ({
    tempId: tempId(),
    confidence: 'low' as const,
    displayName,
    roleHint: displayName,
    needsReview: true,
    reviewReason: 'Участник извлечён из PDF-метки; подтвердите ФИО/роль',
  }))
}

function findWorkItems(
  lines: string[],
  quarterKey?: string,
  sprintName?: string,
): { stories: DraftStory[]; epics: DraftEpic[]; initiatives: DraftInitiative[] } {
  const stories: DraftStory[] = []
  const epicKeys = new Map<string, DraftEpic>()
  const initiativeKeys = new Map<string, DraftInitiative>()

  const storyRe =
    /\b((?:US|CKI|EPIC|INI)[-_]?\d{1,4})\b[:\s\-–—]*(.+)$/i

  for (const line of lines) {
    const match = line.match(storyRe)
    if (!match) continue
    const rawKey = match[1].toUpperCase().replace('_', '-')
    const title = match[2].trim().slice(0, 160)
    if (!title) continue

    if (rawKey.startsWith('INI')) {
      initiativeKeys.set(rawKey, {
        tempId: tempId(),
        confidence: 'medium',
        key: rawKey,
        title,
        quarterKey,
        needsReview: true,
      })
      continue
    }

    if (rawKey.startsWith('EPIC')) {
      epicKeys.set(rawKey, {
        tempId: tempId(),
        confidence: 'medium',
        key: rawKey,
        title,
        needsReview: true,
      })
      continue
    }

    const roleHint = line.match(/\b(БА|СА|ВР|BE|FE|QA|BA|SA)\b/)
    stories.push({
      tempId: tempId(),
      confidence: 'medium',
      key: rawKey.startsWith('US') || rawKey.startsWith('CKI') ? rawKey : undefined,
      title,
      storyType: StoryType.Feature,
      sprintName,
      quarterKey,
      assigneeHints: roleHint ? [roleHint[1]] : undefined,
      stageHints: extractStatusHint(line),
      needsReview: true,
      reviewReason: 'Распознано из строки PDF — проверьте название и связи',
      sourceHint: line.slice(0, 120),
    })
  }

  return {
    stories,
    epics: [...epicKeys.values()],
    initiatives: [...initiativeKeys.values()],
  }
}

function extractStatusHint(line: string): string[] | undefined {
  const hints = ['Backlog', 'Ready', 'In Progress', 'Review', 'Done', 'В работе', 'Готово']
  const found = hints.filter((hint) => line.toLowerCase().includes(hint.toLowerCase()))
  return found.length ? found : undefined
}

function findDependencies(lines: string[], stories: DraftStory[]): DraftDependency[] {
  const keys = stories.map((story) => story.key).filter(Boolean) as string[]
  const deps: DraftDependency[] = []
  const re = /\b((?:US|CKI)[-_]?\d{1,4})\b[^\n]{0,40}(?:→|->|depends on|блок(?:ирует|ируется))\s*((?:US|CKI)[-_]?\d{1,4})\b/gi
  const joined = lines.join('\n')
  for (const match of joined.matchAll(re)) {
    const from = match[1].toUpperCase().replace('_', '-')
    const to = match[2].toUpperCase().replace('_', '-')
    const known = keys.includes(from) && keys.includes(to)
    deps.push({
      tempId: tempId(),
      confidence: known ? 'medium' : 'low',
      fromStoryKey: from,
      toStoryKey: to,
      kind: 'FS',
      unresolved: !known,
      needsReview: true,
      reviewReason: known
        ? 'Зависимость распознана из PDF — подтвердите направление'
        : 'Зависимость требует подтверждения: ключи не сопоставлены со Story',
    })
  }
  return deps
}
