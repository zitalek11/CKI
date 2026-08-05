# 02. Спецификации сущностей — ценность и поставка

Формат каждой сущности:

- назначение / ответственность
- идентификаторы
- обязательные / необязательные / системные / вычисляемые поля
- связи
- ограничения
- жизненный цикл
- события

---

## 2.1. Product

**Назначение:** корневой контейнер учёта.  
**Ответственность:** изолировать команды, шаблоны, статусы, иерархию одного продукта/направления.

### Поля

| Поле | Класс | Описание |
|------|-------|----------|
| id | ID | UUID |
| key | ID | короткий код (`CKI`) |
| name | required | название |
| description | optional | |
| defaultWorkflowTemplateId | optional | шаблон по умолчанию |
| hierarchyPolicyId | required | какие уровни включены |
| defaultCalendarId | required | |
| status | required | `active \| archived` |
| createdAt/By, updatedAt/By, rowVersion | system | |

### Вычисляемые

| Поле | Формула (логически) |
|------|---------------------|
| activeStoryCount | count Stories not terminal |
| openRiskCount | count open Risks |

### Связи

- 1→\* Team, Quarter, Release, WorkflowTemplate, Component, Label, CustomFieldDefinition
- 1→1 HierarchyPolicy
- 1→1..\* Calendar (один default)

### Ограничения

- `key` уникален глобально
- нельзя удалить при наличии non-archived children (только archive)

### Жизненный цикл

`active → archived`

### События

`ProductCreated`, `ProductArchived`, `ProductPolicyChanged`

---

## 2.2. Quarter

**Назначение:** квартальный timebox планирования.  
**Ответственность:** границы периода, связь Goals/Initiatives/Sprints, baseline плана.

### Поля

| Поле | Класс | Описание |
|------|-------|----------|
| id, key | ID | key вида `2026-Q3` |
| productId | required | |
| year | required | |
| index | required | 1..4 |
| startDate, endDate | required | |
| status | required | draft/planning/active/closing/closed |
| capacityBaselineJson | optional | зафиксированный baseline supply |
| notes | optional | |

System fields — стандарт.

### Вычисляемые

| Поле | Описание |
|------|----------|
| health | on_track / at_risk / off_track |
| progress | weighted progress Goals |
| demandByRole | Σ estimates WorkItems в scope |
| supplyByRole | из CapacityPlan периода |
| criticalPathSlackDays | |
| interruptBurnRatio | |

### Связи

- Product 1→\* Quarter
- Quarter 1→\* QuarterGoal, Initiative, Sprint
- Quarter 0..1→\* PlanSnapshot / PlanRevision

### Ограничения

- даты не пересекаются с другим active/planning Quarter того же Product (policy)
- `closed` → immutable без PlanRevision amendment

### Жизненный цикл

`draft → planning → active → closing → closed`

### События

`QuarterOpened`, `QuarterActivated`, `QuarterHealthChanged`, `QuarterClosed`

---

## 2.3. QuarterGoal

**Назначение:** измеримый исход квартала.  
**Ответственность:** связать инициативы с метрикой успеха.

### Поля

| Поле | Класс | Описание |
|------|-------|----------|
| id, key | ID | |
| quarterId | required | |
| title | required | |
| statement | required | формулировка |
| metricDefinitionId | optional | |
| targetValue | optional | |
| currentValue | optional | обновляется вручную или из MetricSample |
| ownerEmployeeId | required | |
| status | required | draft/committed/tracking/achieved/missed/cancelled |
| priorityId | optional | |

### Вычисляемые

| Поле | Описание |
|------|----------|
| health | |
| progressPercent | current/target или rollup Initiatives |
| contributingStoryCount | |

### Связи

- Quarter 1→\* QuarterGoal
- QuarterGoal \*↔\* Initiative через GoalInitiativeLink
- 0..1 MetricDefinition; 1→\* MetricSample

### Ограничения

- commit только в Quarter.status ∈ {planning, active}

### Жизненный цикл

`draft → committed → tracking → achieved|missed|cancelled`

### События

`GoalCommitted`, `GoalHealthChanged`, `GoalClosed`

---

## 2.4. Initiative

**Назначение:** продуктовая ставка квартала.  
**Ответственность:** outcome, capacity envelope, группировка Epics.

### Поля

| Поле | Класс | Описание |
|------|-------|----------|
| id, key | ID | |
| productId, quarterId | required | |
| title | required | |
| outcome | required | ожидаемый результат |
| hypothesis | optional | |
| ownerEmployeeId | required | обычно PM |
| status | required | idea/shaping/committed/executing/done/dropped/archived |
| capacityEnvelope | optional | map RoleSkill→hours или % |
| businessValue | optional | 1..100 или enum |
| priorityId | optional | |
| targetMilestoneId | optional | |

### Вычисляемые

health, progress, demandByRole, envelopeUtilization, riskScore

### Связи

- Quarter 1→\* Initiative (aggregation)
- Initiative 1→\* Epic (aggregation)
- \*↔\* QuarterGoal
- 0..\* Risk, Assumption

### Ограничения

- `committed` требует owner + quarter + nonempty outcome
- cancel/drop committed в active Quarter → Manager + PlanRevision

### Жизненный цикл

`idea → shaping → committed → executing → done|dropped → archived`

### События

`InitiativeCommitted`, `InitiativeScopeChanged`, `InitiativeDropped`

---

## 2.5. Epic

**Назначение:** крупный результат внутри Initiative.  
**Ответственность:** группировать UserStories, держать целевой outcome.

### Поля

| Поле | Класс | Описание |
|------|-------|----------|
| id, key | ID | |
| productId | required | |
| initiativeId | optional\* | рекомендуется; orphan допустим в backlog shaping |
| title | required | |
| description | optional | |
| outcome | optional | |
| ownerEmployeeId | optional | |
| status | required | proposed/approved/in_delivery/done/cancelled/archived |
| priorityId | optional | |
| targetReleaseId | optional | soft intent |
| targetQuarterId | optional | derived обычно из Initiative.quarter |

\*policy: в committed Initiative — initiativeId обязателен.

### Вычисляемые

progress, storyCount, remainingRoleHours, forecastEndDate, health

### Связи

- Initiative 1→\* Epic (aggregation)
- Epic 1→\* Feature? / UserStory (aggregation)
- optional target Release (association)

### Ограничения

- cancel требует стратегию по children (BR-Epic-Cancel)
- hard delete запрещён при children not draft

### Жизненный цикл

`proposed → approved → in_delivery → done|cancelled → archived`

### События

`EpicApproved`, `EpicStarted`, `EpicCancelled`, `EpicCompleted`

### Версионирование

EntityVersion при значимых изменениях scope/outcome (см. 08).

---

## 2.6. Feature (optional)

**Назначение:** промежуточный уровень Epic→Story при HierarchyPolicy.enabled.  
**Ответственность:** группировка, если Epic слишком крупный.

Поля аналогичны Epic (упрощённо): id, key, epicId, title, description, status, owner, priority.

Если HierarchyPolicy выключает Feature — сущность не используется, связи Story идут к Epic напрямую.

---

## 2.7. UserStory  ★ CENTRE

**Назначение:** атом поставки ценности.  
**Ответственность:** держать смысл для пользователя, шаблон процесса, дочерние WorkItems, участие в Sprint/Release.

### Идентификаторы

- `id` UUID
- `key` string unique per Product (`CKI-142`)

### Обязательные поля

| Поле | Описание |
|------|----------|
| productId | |
| title | |
| status | StatusDefinition из StatusModel(UserStory) |
| createdBy | |
| workflowTemplateVersionId | после apply; при create draft может быть null до выбора |
| storyType | enum/ref: feature/bugfix/spike/doc/infra/integration… |

### Необязательные поля

| Поле | Описание |
|------|----------|
| description | |
| businessValue | число/шкала |
| priorityId | |
| epicId / featureId | |
| initiativeId | обычно derived из Epic, может денормализоваться |
| ownerEmployeeId | product owner story |
| teamId | |
| componentIds[] | |
| labelIds[] | |
| storyPoints | относительная оценка |
| targetSprintId | intent |
| targetReleaseId | intent |
| interruptFlag | срочная |
| templateDeviation | bool |
| dorSatisfied | bool (может быть computed) |
| dodSatisfied | bool (computed) |
| custom fields | через CustomFieldValue |

### Системные

createdAt/By, updatedAt/By, archivedAt/By, rowVersion, deletedAt?

### Вычисляемые / производные

| Поле | Источник |
|------|----------|
| quarterId | Initiative/Epic/Sprint chain |
| progress | % mandatory WorkItems done (weighted) |
| blocked | exists unsatisfied hard dependency |
| aggregateStatusHint | from work |
| totalRoleHours | Σ WorkItem estimates |
| remainingRoleHours | |
| forecastStart / forecastEnd | Planning Engine |
| criticalPathFlag | Dependency Engine |
| releaseReadinessContribution | |
| health | |
| activeSprintId | from SprintAssignment |
| releaseIds[] | from ReleaseMembership |
| workItems[] | composition children |
| openDependencyCount | |

### Что НЕ хранится как ручной источник истины

- Progress, Health, Blocked, Forecast dates, Critical path, Capacity impact — только derived (кэш проекций допустим).

### Связи

| Связь | Тип |
|-------|-----|
| Epic/Feature → UserStory | aggregation |
| UserStory → WorkItem | **composition** |
| UserStory → AcceptanceCriterion | **composition** |
| UserStory → WorkflowTemplateVersion | association (immutable apply) |
| UserStory ↔ Sprint | M:N через SprintAssignment (обычно 0..1 active) |
| UserStory ↔ Release | M:N через ReleaseMembership |
| UserStory ↔ Dependency | polymorphic |
| UserStory → Estimate(s) | composition/assoc |
| UserStory → Comment/Attachment/Link | composition/assoc |
| UserStory → EntityVersion / ChangeRecord | audit |

### Ограничения

1. Не более одного active SprintAssignment.
2. Нельзя `done`, пока mandatory WorkItems не terminal.
3. Смена WorkflowTemplate только в `draft|refining` без in_progress work.
4. Hard dependency DAG.
5. key immutable после publish из draft (policy).

### Жизненный цикл

`draft → refining → ready → planned → in_progress → in_review → done|cancelled → archived`  
(детали переходов — StatusModel; guards в 09)

### События (ключевые)

`UserStoryCreated` → `WorkflowApplied` → `WorkItemsGenerated` → `DependenciesBuilt` →  
`StoryReady` → `StoryCommittedToSprint` → `StoryAddedToRelease` → `StoryBlocked`/`Unblocked` →  
`StoryCompleted` / `StoryCancelled` → `StoryReopened`

---

## 2.8. AcceptanceCriterion

**Назначение:** проверяемое условие приёмки Story.  
**Composition** of UserStory.

| Поле | Класс |
|------|-------|
| id | ID |
| userStoryId | required |
| text | required |
| sortOrder | required |
| isSatisfied | required bool |
| satisfiedAt/By | optional |

Жизненный цикл: создаётся/редактируется в refining; `isSatisfied` → при приёмке.  
События: `AcceptanceCriterionAdded`, `AcceptanceCriterionSatisfied`.

Ограничение: для перехода Story → done все AC должны быть satisfied (или waived с reason — policy).

---

## 2.9. WorkItem

**Назначение:** атомарная единица исполнения роли (бывш. «Task»).  
**Ответственность:** статус этапа, estimate, assignee, sprint assignment, вклад в capacity.

### Обязательные

| Поле | Описание |
|------|----------|
| id, key | key может быть `CKI-142-BA` |
| productId | |
| userStoryId | parent |
| workTypeId | |
| title | |
| status | |
| requiredRoleSkillId | |
| origin | `template \| manual` |
| workflowStageKey | optional если manual |
| isMandatory | bool |

### Необязательные

assigneeEmployeeId, description, estimateHours, estimatePointsShare, sprintId (via assignment), plannedStart, plannedEnd, actualStart, actualEnd, blockedReason, checklist progress, sortOrder

### Вычисляемые

readyByDependencies, blocked, forecastStart/End, isOnCriticalPath, utilizationContribution

### Связи

- UserStory ◆─ WorkItem (composition)
- WorkType, RoleSkill associations
- Employee assignee
- SprintAssignment
- Dependency endpoints
- CapacityAllocation

### Ограничения

- нельзя done при unsatisfied hard FS predecessors
- нельзя удалить mandatory без deviation + privilege
- parent Story обязателен

### Жизненный цикл

`planned → ready → in_progress → blocked → in_review → done|cancelled`

### События

`WorkItemCreated`, `WorkItemReady`, `WorkItemStarted`, `WorkItemBlocked`, `WorkItemCompleted`, `WorkItemReassigned`, `WorkItemMovedToSprint`

---

## 2.10. Release

**Назначение:** пакет поставки Story.  
**Ответственность:** membership, gates, readiness, даты релиза.

### Обязательные

id, key/versionName, productId, status, plannedDate (или window start/end)

### Необязательные

releaseType (major/minor/patch/hotfix), ownerEmployeeId, notes, codeFreezeAt, actualReleasedAt

### Вычисляемые

readinessPercent, scopeCompletePercent, openBlockers, riskLevel, remainingRoleHours, forecastDate, criticalPathSlack

### Связи

- Product 1→\* Release
- Release \*↔\* UserStory via ReleaseMembership
- Release 1→\* ReleaseGate (instance evaluations)
- optional Milestone link

### Жизненный цикл

`planned → in_progress → code_freeze → ready → released|cancelled`

### События

`ReleaseScopedChanged`, `ReleaseFreezeStarted`, `ReleaseReadinessChanged`, `ReleaseShipped`, `ReleaseDateMoved`

---

## 2.11. ReleaseMembership

Атрибутированная связь M:N.

| Поле | Описание |
|------|----------|
| releaseId, userStoryId | PK |
| inclusion | must / should / stretch |
| addedAt/By | |
| waived | bool + reason |

Ограничения: уникальность пары; add запрещён в freeze без override.

---

## 2.12. Milestone

**Назначение:** контрольная точка (демо, decision gate), не обязательно Release.

Поля: id, productId, quarterId?, title, date, status (planned/hit/missed/cancelled), linkedGoalIds/InitiativeIds.

Вычисляемые: storiesForecastAfter, riskToDate.

---

## 2.13. Sprint

**Назначение:** каденция исполнения.  
**Ответственность:** commitment, capacity snapshot, velocity actuals.

### Обязательные

id, key/name, productId, quarterId, teamId?, startDate, endDate, status

### Необязательные

sprintGoal, interruptBufferPercent, capacitySnapshot (frozen at planning→active), notes

### Вычисляемые

loadByRole, utilizationByRole, committedStoryCount, completedStoryCount, velocitySP, carryOverCandidates, health

### Связи

- Quarter 1→\* Sprint
- Sprint \*↔\* UserStory/WorkItem via SprintAssignment
- CapacityPlan for period

### Жизненный цикл

`future → planning → active → completed|cancelled`

### Ограничения

- default: один `active` Sprint на Team+Product
- completed иммутабелен для assignments (история)

### События

`SprintPlanningStarted`, `SprintActivated`, `SprintCommitmentChanged`, `SprintCompleted`
