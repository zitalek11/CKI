# 03. Спецификации — процесс, организация, capacity

## 3.1. WorkType

Справочник типов работ.

| Поле | Класс | Примеры значений |
|------|-------|------------------|
| id, productId?, code | ID | `BA`, `SA`, `BE`, `FE`, `QA`, `UX`, `ARCH`, `DOCS`, `DEVOPS` |
| name | required | |
| defaultRoleSkillId | required | |
| description | optional | |
| isActive | required | |

Связи: 1←\* WorkflowStage, WorkItem.  
События: `WorkTypeRegistered`, `WorkTypeDeprecated`.

---

## 3.2. WorkflowTemplate

**Назначение:** именованный конфигурируемый процесс для типов Story.  
**Ответственность:** жизненный цикл шаблона; не содержит stages напрямую — через Version.

| Поле | Класс |
|------|-------|
| id, productId, name, code | required |
| description | optional |
| applicableStoryTypes[] | optional |
| status | draft/review/published/deprecated/archived |
| currentPublishedVersionId | optional |

Связи: 1→\* WorkflowTemplateVersion.  
Жизненный цикл: draft→review→published→deprecated→archived.  
События: `WorkflowTemplatePublished`, `WorkflowTemplateDeprecated`.

---

## 3.3. WorkflowTemplateVersion

**Назначение:** иммутабельный снимок процесса после publish.  
**Ответственность:** stages + dependency rules, от которых генерируются WorkItems.

| Поле | Класс |
|------|-------|
| id, workflowTemplateId, versionNumber | required |
| state | draft/published/superseded |
| publishedAt/By | optional |
| creationPolicy | eager/lazy/hybrid |
| notes | optional |

**Ограничение:** после `published` поля stages/rules неизменяемы.

Composition: ◆ WorkflowStage, ◆ StageDependencyRule.

События: `WorkflowVersionPublished`, `WorkflowVersionSuperseded`.

---

## 3.4. WorkflowStage

| Поле | Класс | Описание |
|------|-------|----------|
| id, templateVersionId | required | |
| key | required | стабильный ключ (`BA`, `SA`) |
| name | required | |
| workTypeId | required | |
| requiredRoleSkillId | required | |
| defaultEstimateHours | optional | |
| defaultEstimatePointsShare | optional | |
| isMandatory | required | |
| creationPolicy | optional override | eager/on_previous_done/manual |
| parallelizable | optional | |
| sortHint | optional | для UI порядка, не для графа |
| assigneeRule | optional | `unassigned \| story_owner \| role_pool_suggest \| fixed_employee` |

Composition children: StageChecklistItem[].

---

## 3.5. StageDependencyRule

| Поле | Класс |
|------|-------|
| id, templateVersionId | required |
| fromStageKey, toStageKey | required |
| dependencyKind | FS/SS/FF/SF |
| strength | hard/soft |
| lagDays | optional ≥0 |

Ограничения: no self; hard-граф stages — DAG.

---

## 3.6. StageChecklistItem

text, required bool, sortOrder — composition of Stage.  
При генерации WorkItem копируется в checklist экземпляра (снимок).

---

## 3.7. TemplateSelectionRule

Автовыбор шаблона.

| Поле | Описание |
|------|----------|
| productId | |
| priority | порядок оценки правил |
| matchStoryType / matchComponentId / matchLabelId | условия |
| workflowTemplateId | результат |
| explanation | текст для пользователя |

---

## 3.8. Team

| Поле | Класс |
|------|-------|
| id, productId, name, code | required |
| calendarId | optional override product default |
| timeboxPolicyId | optional |
| focusPolicyId | optional |
| status | active/archived |

Связи: \*↔\* Employee via Membership/TeamMembership; 1→\* Sprint.

---

## 3.9. Employee

Профиль исполнителя (связь с UserAccount 0..1 или 1..1).

| Поле | Класс |
|------|-------|
| id, productId? | org-level или per product |
| userAccountId | optional |
| displayName | required |
| email | optional |
| status | active/inactive |
| defaultTeamId | optional |
| weeklyHours | required default 40 |
| productAllocationPercent | optional default 100 |

Связи: 1→\* EmployeeSkill, Absence, CapacityPlan; assignee на WorkItems.

---

## 3.10. RoleSkill

Исполнительский пул: `BA`, `SA`, `BE`, `FE`, `QA`, `PM`, `UX`, `ARCH`, …

| Поле | id, code, name, productId?, isActive |

Не путать с AccessRole (RBAC).

---

## 3.11. EmployeeSkill

M:N атрибутированная.

| Поле | Описание |
|------|----------|
| employeeId, roleSkillId | |
| weight | 0..1 (доля capacity навыка) |
| level | junior/middle/senior/expert optional |

Ограничение: Σ weights необязательно =1; supply *= weight.

---

## 3.12. Absence

| Поле | Класс |
|------|-------|
| employeeId | required |
| type | vacation/sick/training/other |
| startDate, endDate | required |
| hoursPerDayOverride | optional |
| status | planned/approved/cancelled |

Событие `AbsenceRegistered` → CapacityEngine.recalculate.

---

## 3.13. Calendar & CalendarException

**Calendar:** id, name, timezone, workdaysMask (пн–пт default), hoursPerDay.

**CalendarException:** calendarId, date, type (holiday/extra_workday), hoursOverride?.

Используется Planning/Capacity engines для рабочих дней.

---

## 3.14. CapacityPlan

План availability на период (Sprint или Quarter).

| Поле | Класс |
|------|-------|
| id | |
| scopeType | sprint/quarter/custom |
| scopeId | |
| teamId? | |
| roleSkillId? | null = per-employee lines |
| employeeId? | |
| availableHours | computed or stored snapshot |
| interruptBufferHours | |
| frozen | bool (snapshot at sprint active) |

**Ответственность:** supply side. Demand считается из WorkItems, не хранится здесь как истина.

---

## 3.15. CapacityAllocation

| Поле | Описание |
|------|----------|
| workItemId | |
| employeeId? | |
| roleSkillId | |
| periodType/Id | sprint/quarter |
| reservedHours | plan |
| actualHours | optional fact |

Связь demand↔person. Может создаваться автоматически при assign.

---

## 3.16. FocusPolicy / TimeboxPolicy

**FocusPolicy:** focusFactor (e.g. 0.75), meetingHoursPerWeek, name.

**TimeboxPolicy:** defaultSprintDays, wipLimitStory, wipLimitWork, interruptBufferPercent, overloadSoftThreshold, overloadHardThreshold, allowMultipleActiveSprints bool.

---

## 3.17. Estimate

Универсальная оценка для PlanningObject.

| Поле | Класс |
|------|-------|
| id | |
| objectType, objectId | UserStory/WorkItem/Epic… |
| estimateType | story_points / role_hours / calendar_days |
| roleSkillId | для role_hours |
| value | number >0 |
| confidence | low/medium/high |
| source | manual/template_default/rolled_up/historical |
| effectiveFrom | optional |

Ограничение: для capacity истинен role_hours на WorkItem; SP — вспомогательный.

---

## 3.18. Dependency

| Поле | Класс |
|------|-------|
| id | |
| fromType, fromId | predecessor |
| toType, toId | successor |
| kind | FS/SS/FF/SF |
| strength | hard/soft |
| lagDays | default 0 |
| reason | optional |
| source | template/manual/inferred |
| externalDependencyId | optional link |
| isSatisfied | **computed** |

Ограничения: no self; hard DAG; идемпотентность пары+kind.

Семантика kind — в 07-engines.

---

## 3.19. ExternalDependency

| Поле | Описание |
|------|----------|
| id, productId | |
| title | |
| ownerName/org | |
| expectedDate | |
| status | identified/waiting/resolved/cancelled |
| impactObjectType/Id | на что влияет |
| escalationLevel | |

Может порождать soft/hard Dependency на Story/WorkItem.

---

## 3.20. Risk / Assumption

**Risk:** title, description, probability, impact, status, linkedObject(s), releaseBlocking?, owner, mitigation.

**Assumption:** statement, status (open/validated/invalidated), linkedObject(s), expiresOn.

Вычисляемые на Risk: riskScore = f(probability, impact); вклад в Release/Quarter risk.
