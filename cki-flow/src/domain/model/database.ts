import type {
  AcceptanceCriterion,
  Dependency,
  DomainEvent,
  Employee,
  EmployeeSkill,
  Epic,
  Initiative,
  Product,
  Quarter,
  QuarterGoal,
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

/** Single local database snapshot — source of truth for Stage 3 storage. */
export type DomainDatabase = {
  version: 1
  products: Product[]
  teams: Team[]
  roleSkills: RoleSkill[]
  workTypes: WorkType[]
  employees: Employee[]
  employeeSkills: EmployeeSkill[]
  quarters: Quarter[]
  quarterGoals: QuarterGoal[]
  initiatives: Initiative[]
  epics: Epic[]
  userStories: UserStory[]
  acceptanceCriteria: AcceptanceCriterion[]
  workItems: WorkItem[]
  workflowTemplates: WorkflowTemplate[]
  workflowTemplateVersions: WorkflowTemplateVersion[]
  dependencies: Dependency[]
  sprints: Sprint[]
  sprintAssignments: SprintAssignment[]
  releases: Release[]
  releaseMemberships: ReleaseMembership[]
  events: DomainEvent[]
}

export function createEmptyDatabase(): DomainDatabase {
  return {
    version: 1,
    products: [],
    teams: [],
    roleSkills: [],
    workTypes: [],
    employees: [],
    employeeSkills: [],
    quarters: [],
    quarterGoals: [],
    initiatives: [],
    epics: [],
    userStories: [],
    acceptanceCriteria: [],
    workItems: [],
    workflowTemplates: [],
    workflowTemplateVersions: [],
    dependencies: [],
    sprints: [],
    sprintAssignments: [],
    releases: [],
    releaseMemberships: [],
    events: [],
  }
}
