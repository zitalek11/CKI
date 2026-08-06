import type { StoryStatus, StoryType } from '@/domain/model/enums'

export type MigrationSourceFormat =
  | 'pdf'
  | 'json'
  | 'csv'
  | 'excel'
  | 'miro'
  | 'jira'
  | 'notion'
  | 'azure_devops'

export type MigrationMode = 'full' | 'update'

export type Confidence = 'high' | 'medium' | 'low'

export type DraftRef = {
  tempId: string
  confidence: Confidence
  needsReview?: boolean
  reviewReason?: string
  sourceHint?: string
}

export type DraftPerson = DraftRef & {
  displayName: string
  roleHint?: string
  email?: string
}

export type DraftQuarter = DraftRef & {
  key: string
  year: number
  index: 1 | 2 | 3 | 4
  startDate: string
  endDate: string
}

export type DraftSprint = DraftRef & {
  name: string
  quarterKey?: string
  startDate: string
  endDate: string
}

export type DraftInitiative = DraftRef & {
  key: string
  title: string
  quarterKey?: string
  outcome?: string
}

export type DraftEpic = DraftRef & {
  key: string
  title: string
  initiativeKey?: string
}

export type DraftStory = DraftRef & {
  key?: string
  title: string
  description?: string
  storyType?: StoryType
  status?: StoryStatus
  epicKey?: string
  initiativeKey?: string
  sprintName?: string
  quarterKey?: string
  releaseKey?: string
  ownerName?: string
  estimateHours?: number
  storyPoints?: number
  assigneeHints?: string[]
  stageHints?: string[]
}

export type DraftDependency = DraftRef & {
  fromStoryKey?: string
  toStoryKey?: string
  fromTitle?: string
  toTitle?: string
  kind?: 'FS' | 'SS' | 'FF' | 'SF'
  unresolved?: boolean
}

export type DraftRelease = DraftRef & {
  key: string
  name: string
  versionName?: string
  plannedDate?: string
  storyKeys: string[]
}

export type MappingRule = {
  id: string
  kind: 'role' | 'status' | 'work_type' | 'person' | 'column'
  source: string
  target: string
  createdAt: string
}

export type ImportDraft = {
  sourceFormat: MigrationSourceFormat
  sourceFileName: string
  analyzedAt: string
  people: DraftPerson[]
  quarters: DraftQuarter[]
  sprints: DraftSprint[]
  initiatives: DraftInitiative[]
  epics: DraftEpic[]
  stories: DraftStory[]
  dependencies: DraftDependency[]
  releases: DraftRelease[]
  mappingRules: MappingRule[]
  rawNotes: string[]
}

export type ImportIssue = {
  severity: 'error' | 'warning' | 'info'
  code: string
  message: string
  targetTempId?: string
}

export type ValidationReport = {
  ok: boolean
  issues: ImportIssue[]
}

export type ImportCounts = {
  initiatives: number
  epics: number
  stories: number
  workItems: number
  employees: number
  dependencies: number
  sprints: number
  quarters: number
  releases: number
}

export type ImportJournal = {
  mode: MigrationMode
  completedAt: string
  imported: ImportCounts
  updated: Partial<ImportCounts>
  warnings: string[]
  skipped: string[]
}

export type UpdateDiffItem = {
  entityType: 'user_story' | 'epic' | 'sprint' | 'employee'
  key: string
  field: string
  before: string
  after: string
}

export type AnalysisSummary = {
  quarters: number
  sprints: number
  stories: number
  epics: number
  initiatives: number
  people: number
  dependencies: number
  releases: number
  needsReview: number
}
