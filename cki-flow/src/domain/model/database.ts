import type {
  Absence,
  AcceptanceCriterion,
  Attachment,
  Comment,
  DefinitionOfDoneItem,
  Dependency,
  DomainEvent,
  Employee,
  EmployeeSkill,
  Epic,
  EstimationTemplate,
  Initiative,
  ObjectLink,
  Product,
  Quarter,
  QuarterGoal,
  RecentObject,
  Release,
  ReleaseMembership,
  RoleSkill,
  Sprint,
  SprintAssignment,
  Team,
  UserStory,
  WorkItem,
  WorkType,
  WorkflowTemplate,
  WorkflowTemplateVersion,
} from '@/domain/model/entities'

/** Single local database snapshot — source of truth. */
export type DomainDatabase = {
  version: 2
  products: Product[]
  teams: Team[]
  roleSkills: RoleSkill[]
  workTypes: WorkType[]
  employees: Employee[]
  employeeSkills: EmployeeSkill[]
  absences: Absence[]
  quarters: Quarter[]
  quarterGoals: QuarterGoal[]
  initiatives: Initiative[]
  epics: Epic[]
  userStories: UserStory[]
  acceptanceCriteria: AcceptanceCriterion[]
  definitionOfDoneItems: DefinitionOfDoneItem[]
  workItems: WorkItem[]
  workflowTemplates: WorkflowTemplate[]
  workflowTemplateVersions: WorkflowTemplateVersion[]
  estimationTemplates: EstimationTemplate[]
  dependencies: Dependency[]
  sprints: Sprint[]
  sprintAssignments: SprintAssignment[]
  releases: Release[]
  releaseMemberships: ReleaseMembership[]
  comments: Comment[]
  attachments: Attachment[]
  objectLinks: ObjectLink[]
  recentObjects: RecentObject[]
  events: DomainEvent[]
}

export function createEmptyDatabase(): DomainDatabase {
  return {
    version: 2,
    products: [],
    teams: [],
    roleSkills: [],
    workTypes: [],
    employees: [],
    employeeSkills: [],
    absences: [],
    quarters: [],
    quarterGoals: [],
    initiatives: [],
    epics: [],
    userStories: [],
    acceptanceCriteria: [],
    definitionOfDoneItems: [],
    workItems: [],
    workflowTemplates: [],
    workflowTemplateVersions: [],
    estimationTemplates: [],
    dependencies: [],
    sprints: [],
    sprintAssignments: [],
    releases: [],
    releaseMemberships: [],
    comments: [],
    attachments: [],
    objectLinks: [],
    recentObjects: [],
    events: [],
  }
}

/** Soft-migrate any persisted snapshot to the current schema. */
export function migrateDatabase(raw: unknown): DomainDatabase {
  const empty = createEmptyDatabase()
  if (!raw || typeof raw !== 'object') return empty
  const input = raw as Partial<DomainDatabase> & { version?: number }

  const db: DomainDatabase = {
    ...empty,
    ...pickArrays(input, empty),
    version: 2,
  }

  db.products = db.products.map((product) => ({
    ...product,
  }))

  db.employees = db.employees.map((employee) => ({
    ...employee,
    hoursPerDay: employee.hoursPerDay ?? 8,
    workDaysPerWeek: employee.workDaysPerWeek ?? 5,
    maxLoadPercent: employee.maxLoadPercent ?? 100,
    weeklyHours:
      employee.weeklyHours ??
      (employee.hoursPerDay ?? 8) * (employee.workDaysPerWeek ?? 5),
  }))

  db.workItems = db.workItems.map((item) => ({
    ...item,
    spentHours: item.spentHours ?? 0,
  }))

  db.userStories = db.userStories.map((story) => ({
    ...story,
    priority: story.priority ?? 'medium',
  }))

  return db
}

function pickArrays(
  input: Partial<DomainDatabase>,
  empty: DomainDatabase,
): Omit<DomainDatabase, 'version'> {
  const result = { ...empty }
  for (const key of Object.keys(empty) as Array<keyof DomainDatabase>) {
    if (key === 'version') continue
    const value = input[key]
    if (Array.isArray(value)) {
      ;(result as Record<string, unknown>)[key] = value
    }
  }
  return result
}
