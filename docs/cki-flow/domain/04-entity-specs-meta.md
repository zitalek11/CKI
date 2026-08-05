# 04. Спецификации — классификация, коллаборация, доступ, meta

## 4.1. Priority

Справочник.

| Поле | id, productId?, code (`critical/high/medium/low`), rankWeight, name, colorToken? |

Связи: association на Story/Epic/Initiative/Risk.

---

## 4.2. BacklogRank

| Поле | objectType=UserStory, objectId, scope (`product_backlog`/`quarter_candidates`/…), rank (fractional string/number) |

Ответственность: стабильный порядок drag-and-drop без переписывания всех рядов.

---

## 4.3. Label / Component

**Label:** id, productId, name, color?, description? — M:N к Story/Epic/…  
**Component:** id, productId, code, name — M:N; участвует в TemplateSelectionRule.

Tag как отдельная сущность **не вводится**.

---

## 4.4. Link / Comment / Attachment

**Link:** fromType/Id, url или toType/Id, title, linkType (relates/documents/implements).

**Comment:** parentType/Id, authorUserId, body, createdAt, editedAt?, parentCommentId?.

**Attachment:** parentType/Id, name, uri/storageRef, mime, size, uploadedBy/At.

Все — association/composition к PlanningObject; не влияют на статус сами по себе (кроме checklist refs).

---

## 4.5. StatusModel / StatusDefinition / StatusTransition

Метамодель статусов (замена «зашитого enum» на конфигурацию).

**StatusModel:** id, productId, entityType, name, isDefault.

**StatusDefinition:** id, statusModelId, code, name, category (`todo/in_progress/blocked/done/cancelled`), isTerminal, sortOrder.

**StatusTransition:** fromStatusId, toStatusId, requiredPermission?, guardKey?, requireReason bool.

Экземпляры сущностей хранят `statusId` (или code + model).  
Жизненные циклы из архитектуры — **рекомендуемые default StatusModels**, не единственно возможные.

---

## 4.6. MetricDefinition / MetricSample

Для QuarterGoal.

**MetricDefinition:** id, name, unit, direction (up/down good).  
**MetricSample:** goalId, value, sampledAt, source (manual/integration).

---

## 4.7. ChangeRecord (History)

Атомарная история изменений **любой** сущности.

| Поле | Обязательность | Описание |
|------|----------------|----------|
| id | required | |
| productId | required | |
| entityType | required | |
| entityId | required | |
| entityVersionNumber | optional | связь с EntityVersion |
| changedAt | required | |
| changedByUserId | required | |
| changeType | required | create/update/delete/status/link/assign/system |
| fieldPath | optional | `status`, `sprintAssignment`, `estimateHours`… |
| oldValueJson | optional | |
| newValueJson | optional | |
| reason | optional/required by policy | |
| correlationId | optional | связка с ActivityEvent / use-case |
| planRevisionId | optional | |

**Ответственность:** forensic audit + undo analysis.  
Не заменяет бизнес-события; дополняет их.

---

## 4.8. ActivityEvent

Семантическое бизнес-событие.

| Поле | Описание |
|------|----------|
| id, productId, type | e.g. `UserStoryCreated` |
| aggregateType/Id | |
| actorUserId | |
| occurredAt | |
| payloadJson | |
| correlationId | |
| causationId | |

Питает ленту, Notification, проекции engines.

---

## 4.9. EntityVersion

Версионирование содержимого.

| Поле | Описание |
|------|----------|
| id | |
| entityType, entityId | |
| versionNumber | monotonic |
| snapshotJson | полное состояние значимых полей |
| createdAt/By | |
| changeSummary | |
| trigger | manual_checkpoint / auto_on_status / replan |

Применяется к: UserStory, Epic, Initiative, WorkflowTemplateVersion (уже versioned), PlanSnapshot (планы).

---

## 4.10. PlanRevision / PlanSnapshot

**PlanRevision:** формальное перепланирование (reason, approver, diffJson, quarterId/sprintId/releaseId).

**PlanSnapshot:** именованный снимок `sprint_plan` / `quarter_plan` / `roadmap` на момент времени; содержимое — ids + ranks + dates + capacity.

---

## 4.11. Notification

| Поле | recipientUserId, type, title, body, entityRef, createdAt, readAt?, channel |

Создаётся реакцией на ActivityEvent по подпискам (простая политика на старте).

---

## 4.12. UserAccount / AccessRole / Permission / Membership

**UserAccount:** id, login/email, displayName, status.  
**AccessRole:** id, code (`Administrator|Manager|ProductManager|BusinessAnalyst|SystemAnalyst|Developer|QA|UX|Architect|Observer`), product-scoped custom roles allowed.  
**Permission:** code (`story.create`, `sprint.commit`, `constraint.override`…).  
**Membership:** userId, scopeType (`product|team`), scopeId, accessRoleId.

Связь AccessRole \*↔\* Permission.

---

## 4.13. CustomFieldDefinition / CustomFieldValue

Расширяемость полей без смены ядра.

**Definition:** entityType, key, dataType (string/number/enum/date/bool/ref), required, enumOptions?, appliesToStoryTypes[]?.  
**Value:** definitionId, entityId, valueJson.

Ограничение: system fields не перекрываются custom keys.

---

## 4.14. HierarchyPolicy / EntityTypeRegistration

**HierarchyPolicy:** productId, featureEnabled bool, initiativeRequiredForEpic bool, …  

**EntityTypeRegistration:** логический реестр типов для polymorphic refs (Dependency, Comment, ChangeRecord) — позволяет добавлять новые типы объектов без ломки движков.

---

## 4.15. SavedView / BoardColumnMapping / DashboardWidget

Метаданные представлений.  
**Запрет:** эти сущности не являются источником статусов/планов.  
BoardColumnMapping: savedViewId, statusId, columnKey, order — только display.
