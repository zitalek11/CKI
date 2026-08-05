# 05. Связи и UML-модель

## 5.1. Матрица кардинальностей (ключевое)

| From → To | Кардинальность | Вид |
|-----------|----------------|-----|
| Product → Quarter | 1..* | aggregation |
| Product → Team | 1..* | aggregation |
| Product → WorkflowTemplate | 1..* | aggregation |
| Product → Release | 1..* | aggregation |
| Quarter → QuarterGoal | 1..* | composition |
| Quarter → Initiative | 1..* | aggregation |
| Quarter → Sprint | 1..* | composition |
| QuarterGoal ↔ Initiative | *..* | association (GoalInitiativeLink) |
| Initiative → Epic | 1..* | aggregation |
| Epic → Feature | 0..* | aggregation (optional level) |
| Epic/Feature → UserStory | 1..* | aggregation |
| UserStory → WorkItem | 1..* | **composition** |
| UserStory → AcceptanceCriterion | 1..* | **composition** |
| UserStory ↔ Sprint | *..* | association (SprintAssignment) |
| WorkItem ↔ Sprint | *..* | association (SprintAssignment) |
| UserStory ↔ Release | *..* | association (ReleaseMembership) |
| WorkflowTemplate → Version | 1..* | composition |
| Version → WorkflowStage | 1..* | composition |
| Version → StageDependencyRule | 0..* | composition |
| Stage → ChecklistItem | 0..* | composition |
| UserStory → WorkflowTemplateVersion | *..1 | association (applied) |
| Employee ↔ RoleSkill | *..* | association (EmployeeSkill) |
| Employee → Absence | 1..* | composition |
| WorkItem → Employee | *..0..1 | association (assignee) |
| WorkItem → RoleSkill | *..1 | association (required) |
| PlanningObject ↔ PlanningObject | *..* | association (Dependency) |
| Entity → ChangeRecord | 1..* | association/audit |
| Entity → EntityVersion | 1..* | association |
| UserAccount ↔ AccessRole | *..* via Membership | association |

---

## 5.2. Абстрактный контракт PlanningObject

Логическое наследование (не обязательно physical table inheritance):

```
PlanningObject
  ├── Initiative
  ├── Epic
  ├── Feature
  ├── UserStory
  ├── WorkItem
  ├── Milestone
  └── Release (частично — для date gates)
```

Общий контракт: `id`, `productId`, `status`, может быть endpoint Dependency, иметь Estimate, ChangeRecord, Comment.

---

## 5.3. UML Class Diagram (Mermaid)

```mermaid
classDiagram
  direction TB

  class Product {
    +UUID id
    +string key
    +string name
  }

  class Quarter {
    +int year
    +int index
    +date startDate
    +date endDate
    +QuarterStatus status
  }

  class QuarterGoal {
    +string title
    +string statement
    +GoalStatus status
  }

  class Initiative {
    +string title
    +string outcome
    +InitiativeStatus status
    +CapacityEnvelope envelope
  }

  class Epic {
    +string title
    +EpicStatus status
  }

  class Feature {
    +string title
    +FeatureStatus status
  }

  class UserStory {
    +string key
    +string title
    +StoryType storyType
    +StoryStatus status
    +int storyPoints
    +bool templateDeviation
  }

  class WorkItem {
    +string key
    +WorkItemStatus status
    +float estimateHours
    +bool isMandatory
    +Origin origin
  }

  class AcceptanceCriterion {
    +string text
    +bool isSatisfied
  }

  class WorkflowTemplate {
    +string name
    +TemplateStatus status
  }

  class WorkflowTemplateVersion {
    +int versionNumber
    +CreationPolicy creationPolicy
  }

  class WorkflowStage {
    +string key
    +float defaultEstimateHours
    +bool isMandatory
  }

  class StageDependencyRule {
    +DepKind kind
    +DepStrength strength
    +int lagDays
  }

  class Sprint {
    +date startDate
    +date endDate
    +SprintStatus status
  }

  class SprintAssignment {
    +AssignmentTarget targetType
  }

  class Release {
    +string versionName
    +ReleaseStatus status
    +date plannedDate
  }

  class ReleaseMembership {
    +Inclusion inclusion
    +bool waived
  }

  class Dependency {
    +DepKind kind
    +DepStrength strength
    +int lagDays
    +DepSource source
  }

  class Team {
    +string name
  }

  class Employee {
    +string displayName
    +float weeklyHours
  }

  class RoleSkill {
    +string code
  }

  class EmployeeSkill {
    +float weight
  }

  class Absence {
    +AbsenceType type
    +date startDate
    +date endDate
  }

  class CapacityPlan {
    +float availableHours
    +bool frozen
  }

  class Estimate {
    +EstimateType type
    +float value
  }

  class ChangeRecord {
    +string fieldPath
    +json oldValue
    +json newValue
    +string reason
  }

  class EntityVersion {
    +int versionNumber
    +json snapshot
  }

  class StatusModel {
    +string entityType
  }

  class AccessRole {
    +string code
  }

  Product "1" *-- "many" Quarter : aggregation
  Product "1" *-- "many" Team
  Product "1" *-- "many" WorkflowTemplate
  Product "1" *-- "many" Release

  Quarter "1" *-- "many" QuarterGoal : composition
  Quarter "1" o-- "many" Initiative : aggregation
  Quarter "1" *-- "many" Sprint : composition

  QuarterGoal "many" -- "many" Initiative : GoalInitiativeLink

  Initiative "1" o-- "many" Epic
  Epic "1" o-- "0..many" Feature
  Epic "1" o-- "many" UserStory
  Feature "1" o-- "many" UserStory

  UserStory "1" *-- "many" WorkItem : composition
  UserStory "1" *-- "many" AcceptanceCriterion : composition
  UserStory "many" --> "1" WorkflowTemplateVersion : applied

  WorkflowTemplate "1" *-- "many" WorkflowTemplateVersion
  WorkflowTemplateVersion "1" *-- "many" WorkflowStage
  WorkflowTemplateVersion "1" *-- "many" StageDependencyRule

  Sprint "1" *-- "many" SprintAssignment
  UserStory "many" -- "many" Sprint : SprintAssignment
  WorkItem "many" -- "many" Sprint : SprintAssignment

  Release "1" *-- "many" ReleaseMembership
  UserStory "many" -- "many" Release : ReleaseMembership

  UserStory "many" -- "many" UserStory : Dependency
  WorkItem "many" -- "many" WorkItem : Dependency

  Team "1" o-- "many" Employee : membership
  Employee "1" *-- "many" EmployeeSkill
  RoleSkill "1" *-- "many" EmployeeSkill
  Employee "1" *-- "many" Absence
  Employee "1" --> "0..many" WorkItem : assignee

  WorkItem --> RoleSkill : required
  WorkItem --> Estimate
  UserStory --> Estimate

  Sprint --> CapacityPlan
  UserStory --> ChangeRecord
  UserStory --> EntityVersion
  Product --> StatusModel
  UserAccount "many" -- "many" AccessRole : Membership
```

---

## 5.4. Диаграмма композиции vs ортогональных измерений

```mermaid
flowchart TB
  subgraph ValueHierarchy["Иерархия ценности"]
    P[Product] --> QG[QuarterGoal]
    P --> I[Initiative]
    I --> E[Epic]
    E --> US[UserStory]
    US --> WI[WorkItem]
  end

  subgraph Orthogonal["Ортогональные измерения"]
    S[Sprint]
    R[Release]
    C[Capacity / RoleSkill]
    Cal[Calendar]
  end

  US -.-> S
  WI -.-> S
  US -.-> R
  WI -.-> C
  S -.-> Cal
```

---

## 5.5. Правила интерпретации связей

1. **Удаление композитного родителя** → каскадный soft-cancel/archive детей (WorkItems, AC, Stages).
2. **Удаление агрегата** → дети отсоединяются по стратегии (Epic cancel), не удаляются молча.
3. **Ортогональные association** удаляются как link rows (SprintAssignment), объект остаётся.
4. **Dependency** не является parent-child и не заменяет композицию.
