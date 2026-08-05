# 11. Event Flows и обоснование решений

## 11.1. Сценарий A — Создание User Story до исполнения

```
1. Actor создаёт UserStory (title, storyType, epic?)
2. System: TemplateSelectionRule → WorkflowTemplate
3. Actor подтверждает/меняет шаблон
4. System ApplyWorkflow:
     WorkItemsGenerated
     DependenciesBuilt
     Estimates seeded
5. PlanningEngine.seedForecast
6. CapacityEngine.previewDemand (warn if needed)
7. Actor уточняет AC, estimates, deps
8. Story → refining → ready (DoR)
9. PM: commit в Sprint (SprintAssignment)
10. CapacityEngine.recalculate(sprint)
11. PlanningEngine.reschedule
12. PM: Add to Release (optional)
13. ReleaseEngine.refresh readiness
14. Исполнение WorkItems по графу
15. WorkItemCompleted → propagate ready
16. AC satisfied → StoryCompleted
17. Epic/Goal/Release aggregates update
```

---

## 11.2. Сценарий B — Перенос Story между спринтами

```
1. Move Story S1 → Sprint B
2. Validate: single active assignment; ACL
3. DependencyEngine: preds/succs timing
4. CapacityEngine: Sprint A ↓, Sprint B ↑
5. If hard overload on B → reject or override
6. PlanningEngine.reschedule Story+successors
7. ReleaseEngine.refresh if member
8. Quarter.health update
9. ChangeRecords + ActivityEvents + Notifications
10. Projections: board/roadmap/capacity
```

---

## 11.3. Сценарий C — Сотрудник уходит в отпуск

```
1. AbsenceRegistered(employee, dates)
2. CapacityEngine: Supply↓ для всех RoleSkills сотрудника
3. Найти WorkItems assignee в периоде
4. PlanningEngine.reschedule / unassign suggestions
5. Если Utilization > thresholds → CapacityOverloadDetected
6. Sprint/Quarter health → at_risk возможно
7. Notification PM + assignees
```

---

## 11.4. Сценарий D — Изменение Workflow (новая version)

```
1. Edit draft WorkflowTemplateVersion vN+1
2. Publish → WorkflowVersionPublished (immutable)
3. New Stories use vN+1
4. Existing Stories remain on vN
5. Optional: StoryWorkflowRebased on eligible draft stories
6. Metrics: template adoption
```

---

## 11.5. Сценарий E — Перенос Release

```
1. ReleaseDateMoved(reason)
2. PlanRevision + Snapshot
3. PlanningEngine compare forecast vs new date
4. ReleaseRiskScore recalc
5. Notify Story owners / PM
6. QuarterGoal health may change
```

---

## 11.6. Сценарий F — Закрытие Epic

```
1. Attempt Epic → done
2. If open children → reject OR cancel policy
3. On Cancel Epic: require children strategy
4. Recompute Initiative progress/health
5. EntityVersion checkpoint
```

---

## 11.7. Сценарий G — Capacity превышен при planning

```
1. Commit Story to Sprint
2. CapacityEngine.Utilization(role)>soft → warn UI/event
3. If >hard → reject unless override
4. Override → ChangeRecord reason + Manager ACL
5. Interrupt path: if interruptFlag, consume buffer first
```

---

## 11.8. Обоснование ключевых решений Domain Model

### D1. WorkItem вместо свободных Task без родителя
Нужен центр ценности (Story) и ролевой capacity. Свободные task-и возвращают хаос доски.

### D2. WorkflowTemplateVersion иммутабелен
Иначе невозможно объяснить исторические планы и безопасно эволюционировать процессы.

### D3. Hybrid creationPolicy
Квартальная предсказуемость (видно demand) + управляемый шум UI.

### D4. Sprint/Release ортогональны иерархии
Иначе перенос поставки ломает дерево ценности.

### D5. RoleSkill ≠ AccessRole
Исполнение и права — разные оси; смешение ломает capacity и RBAC.

### D6. ChangeRecord + ActivityEvent + EntityVersion/PlanSnapshot
Разные вопросы: «какое поле изменилось?», «какой бизнес-факт?», «как выглядел план?».

### D7. Label, не Tag+Label
Один механизм классификации снижает дублирование.

### D8. Feature опционален
Не усложнять ЦКИ обязательным лишним уровнем; HierarchyPolicy оставляет путь роста.

### D9. Critical Path на WorkItems
Stage-level граф точнее Story-level для BA→QA конвейера.

### D10. Views вне write-model
Гарантия, что Kanban никогда снова не станет источником истины.

---

## 11.9. Соответствие требованиям этапа

| Требование | Где закрыто |
|------------|-------------|
| Полный список сущностей | 01 |
| Поля каждой сущности | 02–04 |
| Связи + UML | 05 |
| Workflow templates | 06 |
| Auto task generation | 06 |
| Dependency engine | 07.1 |
| Capacity math | 07.2 |
| Planning engine | 07.3 |
| Release engine | 07.4 |
| History | 08.1 |
| Versioning | 08.2 |
| Business events | 08.3 |
| Business rules | 09 |
| Computed fields | 10.1 |
| Enums | 10.2 |
| Extensibility | 10.3 |
| Event flows | 11.1–11.7 |
| Decisions | 11.8 |

---

## 11.10. Граница этапа

Этот пакет — **нормативная Domain Model**.  
Следующие этапы (вне scope): UX wireframes, физическая модель хранения, API-контракты, реализация.

Код, SQL, UI на этом этапе не создаются.
