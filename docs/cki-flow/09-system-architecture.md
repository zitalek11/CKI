# 09. Предлагаемая архитектура системы

> Этот документ описывает **логическую** архитектуру продукта.  
> Без выбора фреймворков, без схемы БД в SQL, без кода.

## 9.1. Архитектурный стиль

**Domain-centric modular monolith (целевой старт) → выносимые модули по мере роста.**

Почему не microservices с первого дня:

- одна команда-потребитель (ЦКИ);
- единая транзакционная модель планирования (story+works+deps+capacity);
- распределённые транзакции убьют главное качество — корректность перепланирования.

Почему не «просто фронт с JSON-файлом»:

- нужны инварианты, аудит, одновременная работа нескольких ролей.

---

## 9.2. Логические модули (bounded contexts)

```
┌──────────────────────────────────────────────────────────┐
│                     Experience Layer                      │
│  Board View · Roadmap · Backlog · Sprint · Release ·     │
│  Capacity · Dependency Graph · Quarter Health · Search   │
└─────────────────────────────┬────────────────────────────┘
                              │
┌─────────────────────────────▼────────────────────────────┐
│                   Application Services                    │
│  PlanningService · StoryService · TemplateApplicator ·   │
│  SprintCommitService · ReleaseService · ReplanService ·  │
│  Query/Projection builders                                │
└───────┬───────────────┬─────────────────┬────────────────┘
        │               │                 │
┌───────▼──────┐ ┌──────▼──────┐ ┌────────▼────────┐
│ Delivery     │ │ Process     │ │ Scheduling &    │
│ Domain       │ │ Domain      │ │ Capacity Engine │
│ Story/Epic/  │ │ Templates   │ │ Dependencies    │
│ Initiative/  │ │ WorkTypes   │ │ Critical Path   │
│ Release      │ │ DoR/DoD     │ │ Utilization     │
└───────┬──────┘ └──────┬──────┘ └────────┬────────┘
        │               │                 │
┌───────▼───────────────▼─────────────────▼────────┐
│              Organization & Access                 │
│     Product · Team · Employee · RBAC · Calendar    │
└───────────────────────┬──────────────────────────┘
                        │
┌───────────────────────▼──────────────────────────┐
│            Persistence & Events                   │
│  Write models · Read projections · ActivityEvent  │
│  PlanRevision · Notifications                     │
└──────────────────────────────────────────────────┘
```

---

## 9.3. Ключевые подсистемы

### A. Domain Write Model

Хранит объекты и инварианты. Все изменения плана проходят через application services с валидацией.

### B. Process Template Engine

- CRUD шаблонов и версий;
- apply/rebase на Story;
- генерация WorkItems + Dependency.

### C. Dependency & Scheduling Engine

- DAG validation;
- blocked/ready propagation;
- critical path;
- forecast dates (role_hours × calendar × capacity).

### D. Capacity Engine

- supply по RoleSkill и Employee;
- demand из WorkItems;
- utilization, buffers, recommendations.

### E. Projection / View Layer

Строит read-модели для UI:

- Sprint Board columns;
- Roadmap bars;
- Quarter Health widgets;
- Backlog lists;
- Release readiness.

**Важно:** проекции пересобираемы из write model. Доска не пишет «в себя».

### F. Policy / Rules Engine (light)

Конфигурируемые пороги и gates (DoR, overload, freeze) — data-driven.

### G. Identity & Access

RBAC + product membership.

### H. Audit & Collaboration

ActivityEvent, comments, attachments, notifications.

---

## 9.4. Потоки данных (примеры)

### Создание Story

```
UI CreateStory
  → StoryService.create
  → TemplateApplicator.apply(version)
  → CapacityEngine.previewDemand (optional warn)
  → persist Story+Work+Deps
  → emit events → projections update
```

### Перенос Story в другой Sprint

```
UI MoveStory
  → SprintCommitService.move
  → DependencyEngine.validateTiming
  → CapacityEngine.recalculate(fromSprint,toSprint)
  → SchedulingEngine.recomputeCriticalPath
  → persist + PlanRevision/ActivityEvent
  → projections: board, roadmap, health
```

### Закрытие WorkItem

```
UI CompleteWork
  → WorkService.complete
  → DependencyEngine.unblockSuccessors
  → StoryService.refreshAggregateStatus
  → ReleaseService.refreshReadiness (if member)
  → CapacityEngine.actuals hook
  → projections
```

---

## 9.5. Масштабируемость без переписывания

| Изменение | Как добавляется |
|-----------|-----------------|
| Новый процесс | новый ProcessTemplate (+ WorkTypes/RoleSkills при нужде) |
| Новая роль доступа | Role + Permission set |
| Новый тип задачи | WorkType + template stages |
| Новая команда | Team + memberships + calendar + capacity plans |
| Новый продукт | Product + policies + templates import |
| Новый уровень иерархии (Feature) | HierarchyPolicy + optional entity, projections adapt |
| Новая доска | SavedView + BoardColumnMapping |
| Новые метрики риска | Rules в Policy Engine |

Ядро (Story, Work, Dependency, Capacity, Timeboxes) стабильно.

---

## 9.6. Интеграции (логическая рамка, не реализация)

Будущие коннекторы (после ядра):

- документация (Confluence/Wiki) — attachments/links;
- код/CI — статусы release gates;
- календарь отсутствий (HR) — Absences;
- мессенджер — notifications;
- SSO — identity.

Интеграции не должны становиться источником истины для планирования.

---

## 9.7. Нефункциональные требования (архитектурно значимые)

| NFR | Требование |
|-----|------------|
| Consistency | Планирующие операции — атомарны с точки зрения пользователя |
| Auditability | Любое перепланирование объяснимо через ActivityEvent/PlanRevision |
| Usability latency | Пересчёт capacity/critical path на размере команды ЦКИ — интерактивный |
| Safety | Hard invariants нельзя обойти без privilege + reason |
| Longevity | Версионирование шаблонов и статусных моделей |
| Recoverability | Soft delete + возможность rebuild projections |

---

## 9.8. Стратегия представлений (UX architecture)

Минимальный набор рабочих мест:

1. **Quarter Cockpit** — goals, health, risks, capacity by role.
2. **Backlog** — приоритезация и готовность.
3. **Sprint Room** — commit, board, load.
4. **Story Workspace** — центр работы с одной Story и её конвейером.
5. **Dependency Map** — граф/критический путь.
6. **Release Console** — membership + readiness.
7. **Roadmap** — L0–L2.
8. **Admin/Studio** — templates, statuses, roles, calendars.

Доска — один из экранов Sprint Room / Quarter view, не «весь продукт».
