# 06. Workflow Template и автоматическое создание WorkItems

## 6.1. Модель шаблона (итоговая)

```
WorkflowTemplate
 └── WorkflowTemplateVersion (immutable after publish)
      ├── creationPolicy: eager | lazy | hybrid
      ├── WorkflowStage[]
      │    ├── key, workType, roleSkill
      │    ├── defaultEstimateHours
      │    ├── isMandatory
      │    ├── creationPolicy override
      │    ├── assigneeRule
      │    └── StageChecklistItem[]
      └── StageDependencyRule[] (fromKey → toKey, kind, strength, lag)
```

Шаблоны **полностью конфигурируемы**: новые процессы = новые Template+Version, без изменения ядра.

---

## 6.2. Стандартные шаблоны ЦКИ (стартовый набор)

### WT-API — API-функциональность

| Stage key | WorkType | Role | Hours def | Deps |
|-----------|----------|------|-----------|------|
| BA | Business Analysis | BA | 8 | — |
| SA | System Analysis | SA | 12 | BA FS hard |
| BE | Backend Dev | BE | 16 | SA FS hard |
| FE | Frontend Dev | FE | 12 | SA FS hard; BE SS soft optional |
| QA | QA | QA | 10 | BE FS hard, FE FS hard |
| REL | Release Prep | PM | 2 | QA FS hard |

### WT-INTEGRATION — Интеграция

BA → SA → BE → FE → CONTRACT_QA → PARTNER_VAL → REL  
(внешние зависимости Partner — ExternalDependency + soft/hard FS)

### WT-DOCS — Документация

DRAFT (Docs/BA) → REVIEW (SA/PM) → PUBLISH (PM)

### WT-SPIKE — Исследование

RESEARCH (SA/Arch) → FINDINGS_REVIEW (PM+Arch) → DECISION (PM)

### WT-INFRA — Инфраструктура

DESIGN (Arch) → IMPL (BE/DevOps) → SEC_REVIEW (Arch) → ROLLOUT (DevOps) → VERIFY (QA)

---

## 6.3. Алгоритм применения шаблона (ApplyWorkflow)

**Триггер:** создание UserStory с выбранным/авто шаблоном; или явный Apply в `draft|refining`.

```
INPUT: story, templateVersionId
PRECONDITIONS:
  - version.state = published
  - story.status ∈ {draft, refining} OR first-time create
  - no in_progress WorkItems if re-apply

STEPS:
1. Resolve templateVersion
2. Set story.workflowTemplateVersionId = version.id
3. For each stage in version.stages:
     if shouldCreate(stage, version.creationPolicy):
        Create WorkItem:
          title = f"{stage.name}: {story.title}"
          workType = stage.workType
          requiredRoleSkill = stage.requiredRoleSkill
          isMandatory = stage.isMandatory
          origin = template
          workflowStageKey = stage.key
          status = planned
          estimateHours = stage.defaultEstimateHours
          checklist = copy(stage.checklist)
          productId/key inherited
4. For each StageDependencyRule:
     Create Dependency:
       from = WorkItem(fromStageKey)
       to = WorkItem(toStageKey)
       kind/strength/lag = rule
       source = template
5. Run assignee suggestion (optional, non-blocking)
6. Run PlanningEngine.seedForecast(story)
7. Run CapacityEngine.previewDemand(story)
8. Emit: WorkflowApplied, WorkItemsGenerated, DependenciesBuilt
9. Write ChangeRecords + EntityVersion checkpoint
```

### shouldCreate (creationPolicy)

| Policy | Правило |
|--------|---------|
| eager | создавать все stages сразу |
| lazy | создавать только stages без predecessors; остальные — при done predecessor |
| hybrid | создавать все **mandatory** сразу; optional — lazy/manual |

**Канон для ЦКИ:** `hybrid`.

---

## 6.4. Наследование данных

| Поле WorkItem | Источник |
|---------------|----------|
| productId | Story |
| userStoryId | Story |
| teamId | Story.teamId (hint) |
| components/labels | не копируются по умолчанию (живут на Story) |
| sprint assignment | не копируется при create; назначается при planning |
| priority | не копируется (приоритет у Story) |
| title prefix | stage.name |
| estimates | stage defaults → уточняются |

---

## 6.5. Построение зависимостей

1. Template rules → Dependency(source=template).
2. Дополнительно пользователь может добавить Story↔Story deps.
3. FE∥BE: SS soft не блокирует старт, но даёт warn.
4. Multi-predecessor (QA после BE и FE): QA.ready только когда **все** hard FS preds satisfied.

---

## 6.6. Расчёт дат при генерации

После создания:

```
Для каждого WorkItem без pred:
  forecastStart = nextWorkingDay(calendar, max(story.earliestStart, sprint.start?))
  forecastEnd = addWorkingHours(forecastStart, estimateHours, assignee|rolePool calendar)

Для successor:
  FS: forecastStart = pred.forecastEnd + lag
  SS: forecastStart = pred.forecastStart + lag
  FF: forecastEnd = max(own, pred.forecastEnd + lag); start back-calculated
```

Точность на этапе create — ориентир; уточняется Planning Engine при commit в Sprint и absences.

---

## 6.7. Назначение исполнителей

По `assigneeRule` этапа:

| Rule | Поведение |
|------|-----------|
| unassigned | null (default безопасный) |
| story_owner | Story.owner если skill совпадает, иначе null + warn |
| role_pool_suggest | CapacityEngine предлагает Employee с max free supply по RoleSkill |
| fixed_employee | из конфига stage (редко) |

**Автоназначение не должно быть жёстким** без подтверждения в planning (policy flag `autoAssignEnabled`).

---

## 6.8. Обновление при изменении шаблона

Шаблоны версионируются. Изменение процесса = **новая Version**.

| Ситуация | Поведение |
|----------|-----------|
| Version published | новые Story используют её; старые остаются на своей version |
| Rebase Story на новую version | только `draft\|refining`, нет in_progress work; not-started WorkItems пересоздаются; template deps перестраиваются; manual WorkItems сохраняются |
| Stage removed in new version | при rebase — cancel corresponding not-started generated WorkItems |
| Stage added | создаются новые WorkItems |
| Story in_progress | rebase запрещён; только точечные manual add/cancel с deviation |

---

## 6.9. Ручные отклонения

- Add WorkItem manual → origin=manual, templateDeviation может остаться false если mandatory set цел.
- Cancel mandatory → templateDeviation=true + reason + privilege.
- Reorder via new Dependency → allowed с DAG check; deviation если ломает template intent (soft flag).

---

## 6.10. Событийная цепочка создания Story

```
UserStoryCreated
  → WorkflowTemplateSelected
  → WorkflowApplied
  → WorkItemsGenerated
  → DependenciesBuilt
  → ForecastSeeded
  → CapacityDemandChanged
  → ProjectionsInvalidated (backlog/roadmap)
```
