import type { MigrationFileInput, MigrationSourceAdapter } from '@/application/migration/ports'
import type {
  DraftDependency,
  DraftEpic,
  DraftInitiative,
  DraftPerson,
  DraftQuarter,
  DraftRelease,
  DraftSprint,
  DraftStory,
  ImportDraft,
} from '@/domain/migration/types'
import { StoryType } from '@/domain/model/enums'
// Vite bundles the worker as a URL asset (required by pdf.js; empty workerSrc throws).
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

/**
 * Heuristic PDF adapter for ЦКИ board dumps (Miro/PDF exports).
 * Extracts text via pdf.js and looks for quarters, sprints, Jira keys, releases.
 * Low-confidence items are flagged for review.
 */
export class PdfBoardAdapter implements MigrationSourceAdapter {
  readonly format = 'pdf' as const

  canHandle(input: MigrationFileInput): boolean {
    const name = input.fileName.toLowerCase()
    return name.endsWith('.pdf') || input.mimeType.includes('pdf')
  }

  async parse(input: MigrationFileInput): Promise<ImportDraft> {
    const text = await extractPdfText(input.bytes)
    const normalized = normalizeBoardText(text)
    const lines = toLines(normalized)

    const notes: string[] = [
      'PDF-распознавание эвристическое: проверьте результат на шаге «Проверка».',
      `Извлечено символов текста: ${normalized.length}.`,
    ]

    const quarters = findQuarters(normalized)
    const sprints = findSprints(normalized, quarters[0]?.key)
    const releases = findReleases(normalized)
    const people = findPeople(normalized)
    const { stories, epics, initiatives } = findWorkItems(
      normalized,
      lines,
      quarters[0]?.key,
      sprints[0]?.name,
      releases[0]?.key,
    )
    const dependencies = findDependencies(normalized, stories)

    if (stories.length === 0) {
      notes.push(
        'Не удалось надёжно извлечь User Story из PDF. Рекомендуется JSON (cki-board-export) или правка на шаге проверки.',
      )
    } else {
      notes.push(
        `Распознаны ключи задач ЦКИ/Jira (BASIS/PP/T и др.). Часть связей и дат может требовать подтверждения.`,
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
      releases,
      mappingRules: [],
      rawNotes: notes,
    }
  }
}

async function extractPdfText(bytes: ArrayBuffer): Promise<string> {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(bytes),
    useSystemFonts: true,
    isEvalSupported: false,
  })
  const doc = await loadingTask.promise
  const chunks: string[] = []
  for (let pageNo = 1; pageNo <= doc.numPages; pageNo += 1) {
    const page = await doc.getPage(pageNo)
    const content = await page.getTextContent()
    const pageText = content.items.map((item) => ('str' in item ? item.str : '')).join(' ')
    chunks.push(pageText)
  }
  return chunks.join('\n')
}

/** PDF from Miro often emits NUL between chars and glues date ranges. */
function normalizeBoardText(raw: string): string {
  let text = raw.replace(/\u0000/g, '')
  // Fix glued date pairs: 20.04.2630.04.26 → 20.04.26–30.04.26
  text = text.replace(
    /(\d{2}\.\d{2}\.\d{2})(\d{2}\.\d{2}\.\d{2})/g,
    '$1–$2',
  )
  // Collapse broken keys: BASIS464 7 → BASIS4647, BASIS 4295 → BASIS4295
  text = text.replace(/\b(BASIS|PP|T|US|CKI)\s+(\d{3,6})\b/gi, '$1$2')
  text = text.replace(/\b(BASIS|PP|T|US|CKI)(\d{3,5})\s(\d)\b/gi, '$1$2$3')
  // Normalize hyphenated forms
  text = text.replace(/\b(BASIS|PP|T|US|CKI)[-_]?(\d{3,6})\b/gi, (_, p, n) => `${p.toUpperCase()}-${n}`)
  return text.replace(/[ \t]{2,}/g, ' ').trim()
}

function toLines(text: string): string[] {
  // Prefer sentence-ish splits around keys for title capture
  return text
    .split(/\n+|(?=\b(?:BASIS|PP|T|US|CKI)-\d{3,6}\b)/)
    .map((line) => line.trim())
    .filter((line) => line.length > 2)
}

function tempId(): string {
  return crypto.randomUUID()
}

function toIsoDate(ddmmyy: string): string {
  const [dd, mm, yy] = ddmmyy.split('.')
  const year = Number(yy) < 100 ? 2000 + Number(yy) : Number(yy)
  return `${year}-${mm}-${dd}`
}

function findQuarters(text: string): DraftQuarter[] {
  const found = new Map<string, DraftQuarter>()
  const patterns = [
    /\bПлан\s+Q([1-4])\s*(20\d{2})\b/gi,
    /\b(20\d{2})\s*[-/]?\s*Q([1-4])\b/gi,
    /\bQ([1-4])\s*(20\d{2})\b/gi,
  ]

  for (const re of patterns) {
    for (const match of text.matchAll(re)) {
      let year: number
      let index: 1 | 2 | 3 | 4
      if (match[0].toLowerCase().includes('план') || /^Q/i.test(match[0])) {
        // Qn year OR План Qn year
        if (match[2] && match[2].length === 4) {
          index = Number(match[1]) as 1 | 2 | 3 | 4
          year = Number(match[2])
        } else {
          year = Number(match[1])
          index = Number(match[2]) as 1 | 2 | 3 | 4
        }
      } else {
        year = Number(match[1])
        index = Number(match[2]) as 1 | 2 | 3 | 4
      }
      if (![1, 2, 3, 4].includes(index) || year < 2000) continue
      const key = `${year}-Q${index}`
      if (found.has(key)) continue
      const starts = ['01-01', '04-01', '07-01', '10-01'] as const
      const ends = ['03-31', '06-30', '09-30', '12-31'] as const
      found.set(key, {
        tempId: tempId(),
        confidence: 'high',
        key,
        year,
        index,
        startDate: `${year}-${starts[index - 1]}`,
        endDate: `${year}-${ends[index - 1]}`,
        sourceHint: match[0],
      })
    }
  }
  return [...found.values()]
}

function findSprints(text: string, quarterKey?: string): DraftSprint[] {
  const found = new Map<string, DraftSprint>()
  const re =
    /Номер спринта:\s*((?:BASIS\s+)?UPSTREAM\/GSAD\/DEV\d{2}|DEV\d{2})(?:[^Д]{0,40}?Даты:\s*)?(\d{2}\.\d{2}\.\d{2})?[–\-]?(\d{2}\.\d{2}\.\d{2})?/gi

  for (const match of text.matchAll(re)) {
    const rawName = match[1].replace(/\s+/g, ' ').trim()
    const name = rawName.includes('DEV') ? rawName.replace(/^BASIS\s+/i, 'BASIS ') : rawName
    if (found.has(name)) continue
    const startRaw = match[2]
    const endRaw = match[3]
    const ordinal = Number((name.match(/DEV(\d+)/i) ?? [])[1] ?? found.size + 1)
    const fallbackStart = new Date(Date.UTC(2026, 2, 23 + (ordinal - 47) * 14))
    const fallbackEnd = new Date(fallbackStart)
    fallbackEnd.setUTCDate(fallbackEnd.getUTCDate() + 11)
    found.set(name, {
      tempId: tempId(),
      confidence: startRaw && endRaw ? 'high' : 'medium',
      name,
      quarterKey,
      startDate: startRaw ? toIsoDate(startRaw) : fallbackStart.toISOString().slice(0, 10),
      endDate: endRaw ? toIsoDate(endRaw) : fallbackEnd.toISOString().slice(0, 10),
      needsReview: !(startRaw && endRaw),
      reviewReason: startRaw && endRaw ? undefined : 'Даты спринта восстановлены эвристически',
      sourceHint: match[0].slice(0, 120),
    })
  }

  // Fallback: bare DEV## tokens
  if (found.size === 0) {
    for (const match of text.matchAll(/\b(?:UPSTREAM\/GSAD\/)?(DEV\d{2})\b/gi)) {
      const name = `UPSTREAM/GSAD/${match[1].toUpperCase()}`
      if (found.has(name)) continue
      found.set(name, {
        tempId: tempId(),
        confidence: 'low',
        name,
        quarterKey,
        startDate: '2026-04-01',
        endDate: '2026-04-14',
        needsReview: true,
        reviewReason: 'Спринт найден без дат — укажите период вручную',
        sourceHint: match[0],
      })
    }
  }

  return [...found.values()]
}

function findReleases(text: string): DraftRelease[] {
  const found = new Map<string, DraftRelease>()
  for (const match of text.matchAll(/Релиз\s+(R\d{1,2})\s*[(]?\s*(\d{2}\.\d{2})?/gi)) {
    const key = match[1].toUpperCase()
    if (found.has(key)) continue
    const md = match[2]
    const plannedDate = md ? toIsoDate(`${md}.26`) : undefined
    found.set(key, {
      tempId: tempId(),
      confidence: plannedDate ? 'high' : 'medium',
      key,
      name: `Релиз ${key}`,
      versionName: key,
      plannedDate,
      storyKeys: [],
      needsReview: !plannedDate,
      sourceHint: match[0],
    })
  }
  return [...found.values()]
}

function findPeople(text: string): DraftPerson[] {
  const names = new Set<string>()
  const roleCodes = /\b(БА|СА|ВР|BE|FE|QA|BA|SA|PM|ГСАД|ИСС|НРД)\b/g
  for (const match of text.matchAll(roleCodes)) {
    names.add(match[1])
  }
  // "Имя Фамилия" after days marker like "1д Сергей Кошелев"
  for (const match of text.matchAll(
    /\d\s*д\s+([А-ЯЁ][а-яё]+(?:\s+[А-ЯЁ][а-яё]+){0,2})/g,
  )) {
    names.add(match[1].trim())
  }
  for (const match of text.matchAll(/\b([А-ЯЁ]\.[А-ЯЁ]?[а-яё]+)\b/g)) {
    names.add(match[1])
  }

  return [...names].slice(0, 40).map((displayName) => ({
    tempId: tempId(),
    confidence: 'low' as const,
    displayName,
    roleHint: displayName,
    needsReview: true,
    reviewReason: 'Участник извлечён из PDF; подтвердите ФИО/роль',
  }))
}

function findWorkItems(
  text: string,
  lines: string[],
  quarterKey?: string,
  sprintName?: string,
  releaseKey?: string,
): { stories: DraftStory[]; epics: DraftEpic[]; initiatives: DraftInitiative[] } {
  const stories: DraftStory[] = []
  const seen = new Set<string>()
  const epicKeys = new Map<string, DraftEpic>()
  const initiativeKeys = new Map<string, DraftInitiative>()

  const keyRe = /\b((?:BASIS|PP|T|US|CKI)-\d{3,6})\b/gi

  for (const line of lines) {
    for (const match of line.matchAll(keyRe)) {
      const key = match[1].toUpperCase()
      if (seen.has(key)) continue
      seen.add(key)

      const after = line.slice((match.index ?? 0) + match[0].length).trim()
      const before = line.slice(0, match.index ?? 0).trim()
      let title = after.split(/\b(?:BASIS|PP|T|US|CKI)-\d{3,6}\b/)[0]?.trim() ?? ''
      if (title.length < 8 && before.length > title.length) {
        title = before.split(/\b(?:BASIS|PP|T|US|CKI)-\d{3,6}\b/).at(-1)?.trim() ?? title
      }
      title = title
        .replace(/^(?:[–—\-:(]+)\s*/, '')
        .replace(/\s+/g, ' ')
        .replace(/\bБлокирует\b.*$/i, '')
        .trim()
        .slice(0, 160)

      if (!title || title.length < 4) {
        title = key
      }

      if (key.startsWith('INI-')) {
        initiativeKeys.set(key, {
          tempId: tempId(),
          confidence: 'medium',
          key,
          title,
          quarterKey,
          needsReview: true,
        })
        continue
      }
      if (key.startsWith('EPIC-')) {
        epicKeys.set(key, {
          tempId: tempId(),
          confidence: 'medium',
          key,
          title,
          needsReview: true,
        })
        continue
      }

      const stageHints = extractStatusHint(line)
      stories.push({
        tempId: tempId(),
        confidence: title === key ? 'low' : 'medium',
        key,
        title,
        storyType: StoryType.Feature,
        sprintName,
        quarterKey,
        releaseKey,
        stageHints,
        needsReview: true,
        reviewReason: 'Распознано из PDF-доски ЦКИ — проверьте название, спринт и связи',
        sourceHint: line.slice(0, 140),
      })
    }
  }

  // Global pass if line-splitting missed keys
  if (stories.length < 5) {
    for (const match of text.matchAll(keyRe)) {
      const key = match[1].toUpperCase()
      if (seen.has(key)) continue
      seen.add(key)
      const snippet = text.slice(match.index ?? 0, (match.index ?? 0) + 180)
      const title =
        snippet
          .replace(key, '')
          .replace(/\b(?:BASIS|PP|T|US|CKI)-\d{3,6}\b.*/, '')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 160) || key
      stories.push({
        tempId: tempId(),
        confidence: 'low',
        key,
        title,
        storyType: StoryType.Feature,
        sprintName,
        quarterKey,
        releaseKey,
        needsReview: true,
        reviewReason: 'Ключ найден в PDF без надёжного названия',
        sourceHint: snippet.slice(0, 120),
      })
    }
  }

  return {
    stories,
    epics: [...epicKeys.values()],
    initiatives: [...initiativeKeys.values()],
  }
}

function extractStatusHint(line: string): string[] | undefined {
  const hints = [
    'Backlog',
    'Ready',
    'In Progress',
    'Review',
    'Done',
    'В работе',
    'Готово',
    'БТ в работе',
    'нет БТ',
  ]
  const found = hints.filter((hint) => line.toLowerCase().includes(hint.toLowerCase()))
  return found.length ? found : undefined
}

function findDependencies(text: string, stories: DraftStory[]): DraftDependency[] {
  const keys = new Set(stories.map((story) => story.key).filter(Boolean) as string[])
  const deps: DraftDependency[] = []
  const seen = new Set<string>()

  const re =
    /\b((?:BASIS|PP|T|US|CKI)-\d{3,6})\b[^.]{0,80}?Блокирует[^.]{0,80}?\b((?:BASIS|PP|T|US|CKI)-\d{3,6})\b/gi

  for (const match of text.matchAll(re)) {
    const from = match[1].toUpperCase()
    const to = match[2].toUpperCase()
    const id = `${from}->${to}`
    if (seen.has(id)) continue
    seen.add(id)
    const known = keys.has(from) && keys.has(to)
    deps.push({
      tempId: tempId(),
      confidence: known ? 'medium' : 'low',
      fromStoryKey: from,
      toStoryKey: to,
      kind: 'FS',
      unresolved: !known,
      needsReview: true,
      reviewReason: known
        ? 'Зависимость «Блокирует» из PDF — подтвердите направление'
        : 'Зависимость требует подтверждения: ключи не сопоставлены',
    })
  }
  return deps
}
