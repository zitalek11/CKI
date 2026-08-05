import type { WeeklyReport } from '@/core/model/types'
import seed from '../../../resources/reports/2026-07-23.json'

const APP_DIR = 'CKI Report Studio'
const REPORTS_DIR = `${APP_DIR}/reports`
const META_FILE = `${APP_DIR}/.active.json`
const STORAGE_KEY = 'cki-report-studio.reports'
const ACTIVE_KEY = 'cki-report-studio.activeId'

export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

async function fsApi() {
  return import('@tauri-apps/plugin-fs')
}

async function dialogApi() {
  return import('@tauri-apps/plugin-dialog')
}

async function ensureAppDirs(): Promise<void> {
  const { BaseDirectory, exists, mkdir } = await fsApi()
  if (!(await exists(APP_DIR, { baseDir: BaseDirectory.Document }))) {
    await mkdir(APP_DIR, { baseDir: BaseDirectory.Document, recursive: true })
  }
  if (!(await exists(REPORTS_DIR, { baseDir: BaseDirectory.Document }))) {
    await mkdir(REPORTS_DIR, { baseDir: BaseDirectory.Document, recursive: true })
  }
}

function seedLibrary(): Record<string, WeeklyReport> {
  const seedReport = seed as WeeklyReport
  return { [seedReport.meta.id]: seedReport }
}

async function loadLibraryFromFs(): Promise<Record<string, WeeklyReport>> {
  const { BaseDirectory, readDir, readTextFile } = await fsApi()
  await ensureAppDirs()
  const entries = await readDir(REPORTS_DIR, { baseDir: BaseDirectory.Document })
  const library: Record<string, WeeklyReport> = {}

  for (const entry of entries) {
    if (!entry.name?.endsWith('.json')) continue
    const raw = await readTextFile(`${REPORTS_DIR}/${entry.name}`, {
      baseDir: BaseDirectory.Document,
    })
    const report = JSON.parse(raw) as WeeklyReport
    library[report.meta.id] = report
  }

  if (Object.keys(library).length === 0) {
    const seeded = seedLibrary()
    await persistLibraryToFs(seeded)
    return seeded
  }
  return library
}

async function persistLibraryToFs(library: Record<string, WeeklyReport>): Promise<void> {
  const { BaseDirectory, writeTextFile } = await fsApi()
  await ensureAppDirs()
  for (const report of Object.values(library)) {
    await writeTextFile(`${REPORTS_DIR}/${report.meta.id}.json`, JSON.stringify(report, null, 2), {
      baseDir: BaseDirectory.Document,
    })
  }
}

function loadLibraryFromLocalStorage(): Record<string, WeeklyReport> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Record<string, WeeklyReport>
  } catch {
    /* ignore */
  }
  return seedLibrary()
}

function persistLibraryToLocalStorage(library: Record<string, WeeklyReport>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(library))
}

export async function loadLibrary(): Promise<Record<string, WeeklyReport>> {
  if (isTauri()) {
    try {
      return await loadLibraryFromFs()
    } catch (error) {
      console.warn('FS load failed, falling back to localStorage', error)
    }
  }
  return loadLibraryFromLocalStorage()
}

export async function persistLibrary(library: Record<string, WeeklyReport>): Promise<void> {
  if (isTauri()) {
    try {
      await persistLibraryToFs(library)
      return
    } catch (error) {
      console.warn('FS persist failed, falling back to localStorage', error)
    }
  }
  persistLibraryToLocalStorage(library)
}

export async function loadActiveId(fallback: string): Promise<string> {
  if (isTauri()) {
    try {
      const { BaseDirectory, exists, readTextFile } = await fsApi()
      await ensureAppDirs()
      if (await exists(META_FILE, { baseDir: BaseDirectory.Document })) {
        const raw = await readTextFile(META_FILE, { baseDir: BaseDirectory.Document })
        const data = JSON.parse(raw) as { activeId?: string }
        if (data.activeId) return data.activeId
      }
    } catch {
      /* ignore */
    }
  }
  return localStorage.getItem(ACTIVE_KEY) ?? fallback
}

export async function persistActiveId(activeId: string): Promise<void> {
  localStorage.setItem(ACTIVE_KEY, activeId)
  if (!isTauri()) return
  try {
    const { BaseDirectory, writeTextFile } = await fsApi()
    await ensureAppDirs()
    await writeTextFile(META_FILE, JSON.stringify({ activeId }, null, 2), {
      baseDir: BaseDirectory.Document,
    })
  } catch (error) {
    console.warn('Failed to persist active id to FS', error)
  }
}

export async function exportHtmlToDisk(defaultName: string, html: string): Promise<string | null> {
  if (!isTauri()) {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = defaultName
    a.click()
    URL.revokeObjectURL(url)
    return defaultName
  }

  const { save } = await dialogApi()
  const { writeTextFile } = await fsApi()
  const path = await save({
    defaultPath: defaultName,
    filters: [{ name: 'HTML', extensions: ['html'] }],
  })
  if (!path) return null
  await writeTextFile(path, html)
  return path
}

export async function exportJsonToDisk(defaultName: string, report: WeeklyReport): Promise<string | null> {
  const payload = JSON.stringify(report, null, 2)
  if (!isTauri()) {
    const blob = new Blob([payload], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = defaultName
    a.click()
    URL.revokeObjectURL(url)
    return defaultName
  }

  const { save } = await dialogApi()
  const { writeTextFile } = await fsApi()
  const path = await save({
    defaultPath: defaultName,
    filters: [{ name: 'JSON', extensions: ['json'] }],
  })
  if (!path) return null
  await writeTextFile(path, payload)
  return path
}

export function documentsPathHint(): string {
  return '~/Documents/CKI Report Studio/reports'
}
