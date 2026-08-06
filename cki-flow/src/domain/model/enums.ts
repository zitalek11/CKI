export const StoryType = {
  Feature: 'feature',
  Enhancement: 'enhancement',
  Bugfix: 'bugfix',
  Spike: 'spike',
  Documentation: 'documentation',
  Integration: 'integration',
  Infrastructure: 'infrastructure',
  Other: 'other',
} as const
export type StoryType = (typeof StoryType)[keyof typeof StoryType]

export const StoryStatus = {
  Draft: 'draft',
  Refining: 'refining',
  Ready: 'ready',
  Planned: 'planned',
  InProgress: 'in_progress',
  InReview: 'in_review',
  Done: 'done',
  Cancelled: 'cancelled',
  Archived: 'archived',
} as const
export type StoryStatus = (typeof StoryStatus)[keyof typeof StoryStatus]

export const WorkItemStatus = {
  Planned: 'planned',
  Ready: 'ready',
  InProgress: 'in_progress',
  Blocked: 'blocked',
  InReview: 'in_review',
  Done: 'done',
  Cancelled: 'cancelled',
} as const
export type WorkItemStatus = (typeof WorkItemStatus)[keyof typeof WorkItemStatus]

export const WorkItemOrigin = {
  Template: 'template',
  Manual: 'manual',
} as const
export type WorkItemOrigin = (typeof WorkItemOrigin)[keyof typeof WorkItemOrigin]

export const CreationPolicy = {
  Eager: 'eager',
  Lazy: 'lazy',
  Hybrid: 'hybrid',
  OnPreviousDone: 'on_previous_done',
  Manual: 'manual',
} as const
export type CreationPolicy = (typeof CreationPolicy)[keyof typeof CreationPolicy]

export const DependencyKind = {
  FS: 'FS',
  SS: 'SS',
  FF: 'FF',
  SF: 'SF',
} as const
export type DependencyKind = (typeof DependencyKind)[keyof typeof DependencyKind]

export const DependencyStrength = {
  Hard: 'hard',
  Soft: 'soft',
} as const
export type DependencyStrength = (typeof DependencyStrength)[keyof typeof DependencyStrength]

export const DependencySource = {
  Template: 'template',
  Manual: 'manual',
  Inferred: 'inferred',
} as const
export type DependencySource = (typeof DependencySource)[keyof typeof DependencySource]

export const PlanningObjectType = {
  UserStory: 'user_story',
  WorkItem: 'work_item',
  Epic: 'epic',
  Initiative: 'initiative',
  Milestone: 'milestone',
  Release: 'release',
} as const
export type PlanningObjectType = (typeof PlanningObjectType)[keyof typeof PlanningObjectType]

export const QuarterStatus = {
  Draft: 'draft',
  Planning: 'planning',
  Active: 'active',
  Closing: 'closing',
  Closed: 'closed',
} as const
export type QuarterStatus = (typeof QuarterStatus)[keyof typeof QuarterStatus]

export const InitiativeStatus = {
  Idea: 'idea',
  Shaping: 'shaping',
  Committed: 'committed',
  Executing: 'executing',
  Done: 'done',
  Dropped: 'dropped',
  Archived: 'archived',
} as const
export type InitiativeStatus = (typeof InitiativeStatus)[keyof typeof InitiativeStatus]

export const EpicStatus = {
  Proposed: 'proposed',
  Approved: 'approved',
  InDelivery: 'in_delivery',
  Done: 'done',
  Cancelled: 'cancelled',
  Archived: 'archived',
} as const
export type EpicStatus = (typeof EpicStatus)[keyof typeof EpicStatus]

export const SprintStatus = {
  Future: 'future',
  Planning: 'planning',
  Active: 'active',
  Completed: 'completed',
  Cancelled: 'cancelled',
} as const
export type SprintStatus = (typeof SprintStatus)[keyof typeof SprintStatus]

export const ReleaseStatus = {
  Planned: 'planned',
  InProgress: 'in_progress',
  CodeFreeze: 'code_freeze',
  Ready: 'ready',
  Released: 'released',
  Cancelled: 'cancelled',
} as const
export type ReleaseStatus = (typeof ReleaseStatus)[keyof typeof ReleaseStatus]

export const TemplateStatus = {
  Draft: 'draft',
  Review: 'review',
  Published: 'published',
  Deprecated: 'deprecated',
  Archived: 'archived',
} as const
export type TemplateStatus = (typeof TemplateStatus)[keyof typeof TemplateStatus]

export const TemplateVersionState = {
  Draft: 'draft',
  Published: 'published',
  Superseded: 'superseded',
} as const
export type TemplateVersionState = (typeof TemplateVersionState)[keyof typeof TemplateVersionState]

export const HealthStatus = {
  OnTrack: 'on_track',
  AtRisk: 'at_risk',
  OffTrack: 'off_track',
} as const
export type HealthStatus = (typeof HealthStatus)[keyof typeof HealthStatus]

export const AssigneeRule = {
  Unassigned: 'unassigned',
  StoryOwner: 'story_owner',
  RolePoolSuggest: 'role_pool_suggest',
  FixedEmployee: 'fixed_employee',
} as const
export type AssigneeRule = (typeof AssigneeRule)[keyof typeof AssigneeRule]

export const ReleaseInclusion = {
  Must: 'must',
  Should: 'should',
  Stretch: 'stretch',
} as const
export type ReleaseInclusion = (typeof ReleaseInclusion)[keyof typeof ReleaseInclusion]
