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
  storySequence: number
}

export type Team = SystemFields & {
  id: UUID
  productId: UUID
  name: string
  code: string
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
  defaultTeamId?: UUID
  weeklyHours: number
  productAllocationPercent: number
  status: 'active' | 'inactive'
}

export type EmployeeSkill = {
  id: UUID
  employeeId: UUID
  roleSkillId: UUID
  weight: number
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

export type UserStory = SystemFields & {
  id: UUID
  productId: UUID
  key: string
  title: string
  description?: string
  storyType: StoryType
  status: StoryStatus
  epicId?: UUID
  initiativeId?: UUID
  teamId?: UUID
  ownerEmployeeId?: UUID
  workflowTemplateVersionId?: UUID
  storyPoints?: number
  businessValue?: number
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

export type WorkItem = SystemFields & {
  id: UUID
  productId: UUID
  userStoryId: UUID
  key: string
  title: string
  workTypeId: UUID
  requiredRoleSkillId: UUID
  status: WorkItemStatus
  origin: WorkItemOrigin
  workflowStageKey?: string
  isMandatory: boolean
  assigneeEmployeeId?: UUID
  estimateHours: number
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
