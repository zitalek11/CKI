import type {
  AssigneeRule,
  CreationPolicy,
  DependencyKind,
  DependencySource,
  DependencyStrength,
  EpicStatus,
  InitiativeStatus,
  PlanningObjectType,
  QuarterStatus,
  ReleaseInclusion,
  ReleaseStatus,
  SprintStatus,
  StoryStatus,
  StoryType,
  TemplateStatus,
  TemplateVersionState,
  WorkItemOrigin,
  WorkItemStatus,
} from '@/domain/model/enums'
import type { UUID } from '@/domain/model/ids'
import type { IsoDate, SystemFields } from '@/domain/model/system'

export type Product = SystemFields & {
  id: UUID
  key: string
  name: string
  description?: string
  defaultWorkflowTemplateId?: UUID
  defaultEstimationTemplateId?: UUID
  storySequence: number
  activeQuarterId?: UUID
  activeSprintId?: UUID
}

export type Team = SystemFields & {
  id: UUID
  productId: UUID
  name: string
  code: string
  status?: 'active' | 'inactive'
}

export type RoleSkill = SystemFields & {
  id: UUID
  productId: UUID
  code: string
  name: string
  isActive: boolean
}

export type WorkType = SystemFields & {
  id: UUID
  productId: UUID
  code: string
  name: string
  defaultRoleSkillId: UUID
  isActive: boolean
}

export type Employee = SystemFields & {
  id: UUID
  productId: UUID
  displayName: string
  email?: string
  jobTitle?: string
  defaultTeamId?: UUID
  color?: string
  /** Hours per working day (default 8). */
  hoursPerDay: number
  /** Working days per week (default 5). */
  workDaysPerWeek: number
  /** Legacy / derived weekly capacity. */
  weeklyHours: number
  productAllocationPercent: number
  maxLoadPercent: number
  notes?: string
  status: 'active' | 'inactive'
}

export type EmployeeSkill = {
  id: UUID
  employeeId: UUID
  roleSkillId: UUID
  weight: number
}

export type AbsenceKind = 'vacation' | 'sick' | 'holiday' | 'other'

export type Absence = SystemFields & {
  id: UUID
  productId: UUID
  employeeId: UUID
  kind: AbsenceKind
  startDate: IsoDate
  endDate: IsoDate
  note?: string
}

export type Quarter = SystemFields & {
  id: UUID
  productId: UUID
  key: string
  year: number
  index: 1 | 2 | 3 | 4
  startDate: IsoDate
  endDate: IsoDate
  status: QuarterStatus
}

export type QuarterGoal = SystemFields & {
  id: UUID
  quarterId: UUID
  productId: UUID
  title: string
  statement: string
  ownerEmployeeId?: UUID
  status: 'draft' | 'committed' | 'tracking' | 'achieved' | 'missed' | 'cancelled'
  targetValue?: number
  currentValue?: number
}

export type Initiative = SystemFields & {
  id: UUID
  productId: UUID
  quarterId: UUID
  key: string
  title: string
  outcome: string
  ownerEmployeeId?: UUID
  status: InitiativeStatus
  businessValue?: number
}

export type Epic = SystemFields & {
  id: UUID
  productId: UUID
  initiativeId?: UUID
  key: string
  title: string
  description?: string
  ownerEmployeeId?: UUID
  status: EpicStatus
}

export type StoryPriority = 'critical' | 'high' | 'medium' | 'low'

export type UserStory = SystemFields & {
  id: UUID
  productId: UUID
  key: string
  title: string
  description?: string
  /** Classic card: Как <роль> */
  asA?: string
  /** Я хочу <действие> */
  iWant?: string
  /** Чтобы <ценность> */
  soThat?: string
  storyType: StoryType
  status: StoryStatus
  priority?: StoryPriority
  epicId?: UUID
  initiativeId?: UUID
  teamId?: UUID
  ownerEmployeeId?: UUID
  workflowTemplateVersionId?: UUID
  estimationTemplateId?: UUID
  targetSprintId?: UUID
  targetQuarterId?: UUID
  targetReleaseId?: UUID
  storyPoints?: number
  businessValue?: number
  estimateHours?: number
  interruptFlag: boolean
  templateDeviation: boolean
  backlogRank: string
}

export type AcceptanceCriterion = SystemFields & {
  id: UUID
  userStoryId: UUID
  text: string
  sortOrder: number
  isSatisfied: boolean
}

export type DefinitionOfDoneItem = SystemFields & {
  id: UUID
  userStoryId: UUID
  text: string
  sortOrder: number
  isSatisfied: boolean
}

export type WorkItem = SystemFields & {
  id: UUID
  productId: UUID
  userStoryId: UUID
  key: string
  title: string
  description?: string
  goal?: string
  expectedResult?: string
  workTypeId: UUID
  requiredRoleSkillId: UUID
  status: WorkItemStatus
  origin: WorkItemOrigin
  workflowStageKey?: string
  isMandatory: boolean
  assigneeEmployeeId?: UUID
  estimateHours: number
  spentHours: number
  sprintId?: UUID
  forecastStart?: IsoDate
  forecastEnd?: IsoDate
}

export type WorkflowTemplate = SystemFields & {
  id: UUID
  productId: UUID
  code: string
  name: string
  description?: string
  status: TemplateStatus
  currentPublishedVersionId?: UUID
  applicableStoryTypes: StoryType[]
}

export type WorkflowStage = {
  id: UUID
  key: string
  name: string
  workTypeId: UUID
  requiredRoleSkillId: UUID
  defaultEstimateHours: number
  isMandatory: boolean
  creationPolicy?: CreationPolicy
  assigneeRule: AssigneeRule
  sortHint: number
  /** Markdown/plain description template applied to generated WorkItems. */
  descriptionTemplate?: string
  goalTemplate?: string
  expectedResultTemplate?: string
}

export type StageDependencyRule = {
  id: UUID
  fromStageKey: string
  toStageKey: string
  kind: DependencyKind
  strength: DependencyStrength
  lagDays: number
}

export type WorkflowTemplateVersion = SystemFields & {
  id: UUID
  workflowTemplateId: UUID
  versionNumber: number
  state: TemplateVersionState
  creationPolicy: CreationPolicy
  stages: WorkflowStage[]
  dependencyRules: StageDependencyRule[]
  publishedAt?: string
}

export type EstimationTemplateLine = {
  id: UUID
  stageKey: string
  stageName: string
  roleSkillCode: string
  estimateHours: number
  sortHint: number
}

export type EstimationTemplate = SystemFields & {
  id: UUID
  productId: UUID
  code: string
  name: string
  description?: string
  isDefault: boolean
  lines: EstimationTemplateLine[]
}

export type Dependency = SystemFields & {
  id: UUID
  productId: UUID
  fromType: PlanningObjectType
  fromId: UUID
  toType: PlanningObjectType
  toId: UUID
  kind: DependencyKind
  strength: DependencyStrength
  lagDays: number
  reason?: string
  source: DependencySource
}

export type Sprint = SystemFields & {
  id: UUID
  productId: UUID
  quarterId: UUID
  teamId?: UUID
  name: string
  startDate: IsoDate
  endDate: IsoDate
  status: SprintStatus
  interruptBufferPercent: number
  goal?: string
}

export type SprintAssignment = {
  id: UUID
  sprintId: UUID
  targetType: 'user_story' | 'work_item'
  targetId: UUID
  committedAt: string
  committedBy: string
}

export type Release = SystemFields & {
  id: UUID
  productId: UUID
  key: string
  name: string
  versionName: string
  status: ReleaseStatus
  plannedDate?: IsoDate
}

export type ReleaseMembership = {
  id: UUID
  releaseId: UUID
  userStoryId: UUID
  inclusion: ReleaseInclusion
  waived: boolean
  waivedReason?: string
}

export type Comment = SystemFields & {
  id: UUID
  productId: UUID
  targetType: 'user_story' | 'work_item'
  targetId: UUID
  body: string
  author: string
}

export type Attachment = SystemFields & {
  id: UUID
  productId: UUID
  targetType: 'user_story' | 'work_item'
  targetId: UUID
  name: string
  url: string
  mimeType?: string
}

export type ObjectLink = SystemFields & {
  id: UUID
  productId: UUID
  targetType: 'user_story' | 'work_item'
  targetId: UUID
  title: string
  url: string
}

export type DomainEvent = {
  id: UUID
  productId: UUID
  type: string
  aggregateType: string
  aggregateId: UUID
  occurredAt: string
  actor: string
  payload: Record<string, unknown>
}

export type RecentObject = {
  id: string
  productId: UUID
  objectType: 'user_story' | 'work_item' | 'sprint' | 'quarter' | 'release' | 'employee'
  objectId: UUID
  label: string
  path: string
  openedAt: string
}
