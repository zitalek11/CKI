# 08. History · Versioning · Business Events

## 8.1. History (ChangeRecord)

### Что хранить

Для **каждого** значимого изменения любой бизнес-сущности:

| Атрибут | Обязателен | Пример |
|---------|------------|--------|
| entityType + entityId | да | UserStory / CKI-142 |
| changedAt | да | timestamp UTC |
| changedByUserId | да | user |
| changeType | да | update/status/assign/link… |
| fieldPath | да для update | `status`, `estimateHours`, `epicId` |
| oldValueJson | да если было | `"ready"` |
| newValueJson | да | `"planned"` |
| reason | по policy | «перенос из-за зависимости SA» |
| correlationId | желательно | id use-case транзакции |
| planRevisionId | если replan | |

### Политики reason-required

Обязательный reason:

- cancel / drop / reopen
- override hard constraint
- remove mandatory WorkItem
- move release date
- mass sprint replan
- waive release membership

### Что не пишем как ChangeRecord

- пересчёт чистых derived-полей (progress/health) — либо system ChangeRecord type=`system_recompute` (опционально, семплировать), либо только в проекциях
- чтение данных

---

## 8.2. Versioning

### Уровни

| Объект | Механизм | Когда новая версия |
|--------|----------|--------------------|
| WorkflowTemplate | WorkflowTemplateVersion | publish |
| UserStory | EntityVersion | checkpoint: ready, sprint commit, major scope edit, cancel |
| Epic | EntityVersion | approve, major scope, cancel |
| Initiative | EntityVersion | commit, drop, envelope change |
| Sprint Plan | PlanSnapshot | sprint active; completed |
| Quarter Plan | PlanSnapshot | quarter active; each PlanRevision |
| Roadmap | PlanSnapshot | on-demand + on PlanRevision |
| Release scope | EntityVersion / Snapshot | freeze; released |

### Семантика UserStory v1/v2/v3

Не «ветвление как git merge», а **monotonic checkpoints**:

- v1 — после apply workflow
- v2 — после перехода в ready (зафиксированы AC/estimates)
- v3 — после изменения scope mid-flight (reason)

Текущее состояние = head; история = EntityVersion + ChangeRecords.

### Snapshot vs EntityVersion

- **EntityVersion** — снимок одной сущности.
- **PlanSnapshot** — снимок среза плана (много сущностей + ranks + capacity).

---

## 8.3. Каталог Business Events

Формат: событие → последствия (engines/проекции/уведомления).

### Создание и шаблон

| Событие | Последствия |
|---------|-------------|
| `EpicCreated` | projections; optional notification owner |
| `UserStoryCreated` | wait for template / auto-select |
| `WorkflowTemplateSelected` | |
| `WorkflowApplied` | bind version |
| `WorkItemsGenerated` | Capacity demand↑ |
| `DependenciesBuilt` | DependencyEngine init; Planning seed |
| `AssigneesSuggested` | optional Notification |

### Планирование

| Событие | Последствия |
|---------|-------------|
| `StoryReady` | backlog segment change |
| `StoryCommittedToSprint` | Capacity recalc; Planning; Sprint load |
| `StoryUncommittedFromSprint` | reverse capacity |
| `StoryMovedBetweenSprints` | dual capacity; deps check; roadmap |
| `WorkItemMovedToSprint` | split-capacity path |
| `SprintActivated` | freeze CapacityPlan snapshot |
| `SprintCompleted` | velocity; carry-over proposals; snapshot |
| `QuarterActivated` | baseline snapshot |
| `PlanRevisionCreated` | before/after snapshots; health |

### Исполнение

| Событие | Последствия |
|---------|-------------|
| `WorkItemStarted` | Story→in_progress if needed; SS deps may satisfy |
| `WorkItemCompleted` | Ready propagation; Story progress; Release readiness |
| `WorkItemBlocked` | Story.blocked; Quarter risk; Notification |
| `WorkItemUnblocked` | reverse |
| `AcceptanceCriterionSatisfied` | DoD check |
| `StoryCompleted` | Epic progress; Release completion; Goal progress |
| `StoryCancelled` | cascade work cancel; capacity free; release membership update |
| `StoryReopened` | audit; capacity demand returns |

### Capacity / People

| Событие | Последствия |
|---------|-------------|
| `AbsenceRegistered` | Supply↓; reschedule; health |
| `AbsenceCancelled` | reverse |
| `EmployeeSkillChanged` | Supply pools |
| `CapacityOverloadDetected` | warn/block; Notification PM |
| `InterruptBufferExhausted` | require swap policy |

### Release / Roadmap

| Событие | Последствия |
|---------|-------------|
| `StoryAddedToRelease` | readiness recalc |
| `StoryRemovedFromRelease` | readiness |
| `ReleaseFreezeStarted` | membership lock |
| `ReleaseReadinessChanged` | notifications |
| `ReleaseDateMoved` | planning + risk |
| `ReleaseShipped` | snapshot; stories stay done |
| `RoadmapProjectionRebuilt` | read model only |

### Workflow changes

| Событие | Последствия |
|---------|-------------|
| `WorkflowVersionPublished` | available for new stories |
| `StoryWorkflowRebased` | regenerate not-started work; rebuild template deps |
| `TemplateDeviationMarked` | planning quality metrics |

### Риски

| Событие | Последствия |
|---------|-------------|
| `RiskIdentified` | Goal/Release risk scores |
| `RiskRealized` | may create PlanRevision suggestion |
| `ExternalDependencyResolved` | unblock deps |

---

## 8.4. Корреляция событий

Один user action (например «перенести Story в Sprint 5») порождает:

```
correlationId = X
  ActivityEvent StoryMovedBetweenSprints
  ChangeRecord sprintAssignment old/new
  ActivityEvent CapacityDemandChanged (×2 periods)
  ActivityEvent ForecastRecalculated
  ActivityEvent RoadmapProjectionRebuilt
  optional Notification[]
```

Это обязательно для аудита «почему уехал квартал».
