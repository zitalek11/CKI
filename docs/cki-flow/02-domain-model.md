# 02. Полная модель предметной области

## 2.1. Карта сущностей

Сущности сгруппированы по bounded contexts.

### A. Ценность и scope

| Сущность | Назначение |
|----------|------------|
| **Product** | Продукт/направление, контейнер всего учёта |
| **Quarter** | Квартальный timebox планирования |
| **QuarterGoal** | Цель квартала (измеримый исход) |
| **Initiative** | Продуктовая ставка/тема внутри квартала |
| **Epic** | Крупный результат, группирует Story |
| **UserStory** | Центральный объект поставки ценности |
| **WorkItem** | Атомарная работа (этап конвейера) |
| **AcceptanceCriterion** | Критерий приёмки Story |

### B. Процессы и шаблоны

| Сущность | Назначение |
|----------|------------|
| **ProcessTemplate** | Шаблон конвейера работ для типа Story |
| **ProcessTemplateVersion** | Версия шаблона (иммутабельна после publish) |
| **ProcessStage** | Этап шаблона (BA, SA, Dev, QA…) |
| **StageDependencyRule** | Правило зависимости между этапами шаблона |
| **WorkType** | Тип работы (справочник: Business Analysis, Backend Dev…) |

### C. Время и календарь

| Сущность | Назначение |
|----------|------------|
| **Sprint** | Итерация исполнения внутри/поверх квартала |
| **Calendar** | Рабочий календарь (праздники, исключения) |
| **Milestone** | Контрольная точка (не обязательно = Release) |
| **TimeboxPolicy** | Правила длины спринта, буферов, WIP |

### D. Поставка

| Сущность | Назначение |
|----------|------------|
| **Release** | Релизная поставка (пакет Story) |
| **ReleaseMembership** | Связь Story ↔ Release |
| **DeploymentEnvironment** | Опционально: Dev/Stage/Prod (метаданные готовности) |

### E. Организация и capacity

| Сущность | Назначение |
|----------|------------|
| **Team** | Команда (может быть несколько внутри Product) |
| **Employee** | Сотрудник |
| **RoleSkill** | Ролевой навык/пул (BA, SA, BE, FE, QA, PM, UX, Arch…) |
| **EmployeeSkill** | Связь сотрудник ↔ навык (доля/уровень) |
| **CapacityPlan** | План доступности на период (Sprint/Quarter) |
| **CapacityAllocation** | Резерв/факт загрузки на Work Item / Story |
| **Absence** | Отсутствия (отпуск, болезнь, обучение) |

### F. Связи и планирование

| Сущность | Назначение |
|----------|------------|
| **Dependency** | Зависимость между любыми планируемыми объектами |
| **Estimate** | Оценка (SP / часы / ролевые часы) |
| **Priority** | Приоритет (справочник + rank) |
| **BacklogRank** | Порядок в бэклоге (fractional indexing) |
| **Risk** | Зафиксированный риск с влиянием на план |
| **Assumption** | Допущение планирования |

### G. Классификация и коллаборация

| Сущность | Назначение |
|----------|------------|
| **Label** | Метка |
| **Component** | Компонент продукта (API, UI, Docs, Infra…) |
| **Status** | Статус экземпляра (из StatusModel) |
| **StatusModel** | Конечный автомат статусов для типа сущности |
| **Comment** | Комментарий |
| **Attachment** | Вложение / ссылка на артефакт |
| **ActivityEvent** | Событие аудита/ленты |
| **Notification** | Уведомление пользователю |

### H. Доступ

| Сущность | Назначение |
|----------|------------|
| **UserAccount** | Учётная запись |
| **Role** | Роль RBAC |
| **Permission** | Право |
| **Membership** | Участие пользователя в Team/Product с ролью |

### I. Представления (не источник истины)

| Сущность | Назначение |
|----------|------------|
| **SavedView** | Сохранённый фильтр/доска/roadmap-срез |
| **BoardColumnMapping** | Маппинг статусов → колонки конкретной доски |
| **DashboardWidget** | Виджет метрик |

---

## 2.2. Рекомендуемая иерархия (целевая)

```
Product
├── Teams[], Employees[], RoleSkills[], Calendars[]
├── ProcessTemplates[]
├── Quarters[]
│   ├── QuarterGoals[]
│   ├── Initiatives[]
│   │   └── Epics[]
│   │       └── UserStories[]
│   │           ├── AcceptanceCriteria[]
│   │           └── WorkItems[]   ← из ProcessTemplate
│   └── Sprints[]                 ← ортогонально Story
├── Releases[]                    ← ортогонально Story
└── Backlog (виртуальный): UserStories без активного Sprint / в статусе backlog
```

### Почему нет Feature между Epic и Story

**Альтернатива:** Epic → Feature → Story.

**Решение для ЦКИ:** Feature **не обязателен** в ядре.

Обоснование:

- у команды уже есть Initiative (стратегия) и Epic (крупный результат);
- Feature часто дублирует Epic или Story и создаёт «лишний клик»;
- при необходимости Feature вводится как **опциональный уровень** (`Epic → Feature? → Story`) через конфигурацию иерархии Product, без смены ядра.

---

## 2.3. Описание ключевых сущностей

### Product

Контейнер учёта. Позволяет масштабировать систему на несколько продуктов ЦКИ.

Ключевые поля (логически):

- name, code, description
- defaultProcessTemplate
- hierarchyPolicy (какие уровни включены)
- statusModel bindings

### Quarter

Плановый период (обычно 13 недель / набор спринтов).

- year, index (Q1–Q4) или date range
- status: `draft | planning | active | closing | closed`
- linked Sprint[]
- capacityBaseline (суммарная доступность по ролям)

### QuarterGoal

Измеримая цель квартала.

- statement, metric, targetValue, currentValue
- owner (Employee)
- linked Initiatives[]
- health: `on_track | at_risk | off_track`

**Улучшение:** Goal не обязана 1:1 совпадать с Initiative. Одна Goal может покрываться несколькими Initiative; Initiative может поддерживать несколько Goals (N:M через `GoalInitiativeLink`).

### Initiative

Продуктовая ставка квартала («зачем мы это делаем»).

- title, outcome, hypothesis
- owner (обычно PM)
- quarterId
- budget/capacity envelope (ролевые часы или % квартала)
- status lifecycle

### Epic

Крупный результат внутри Initiative.

- title, problem/outcome
- targetRelease? (soft)
- progress = агрегат по Story (вычисляемое)
- status lifecycle

### UserStory (центр системы)

Атом ценности для пользователя/стейкхолдера.

Обязательный минимум при создании:

- title
- productId
- processTemplateId (или auto-detect по типу)
- creator

Рекомендуемый профиль:

- description / context
- persona / beneficiary
- acceptanceCriteria[]
- epicId? (может быть orphan в backlog)
- priority + backlogRank
- estimate (story-level SP и/или rollup из Work)
- targetSprint? / targetRelease?
- component[], labels[]
- risk flags

**Инвариант:** создание Story запускает применение Process Template → генерацию Work Items + Dependency.

### WorkItem

Единица исполнения роли.

- workType (BA / SA / Backend / Frontend / QA / …)
- parentUserStoryId
- assignee?
- estimateHours / estimatePoints
- sprintId? (может отличаться от sprint Story в редких случаях — см. правила)
- status
- blockedBy[] (проекция из Dependency)

Work Item **не заменяет** Story на доске ценности; на execution-доске колонки могут показывать Work.

### ProcessTemplate

Универсальный механизм процессов (см. документ 04).

- name, applicableTo (story types / components)
- stages[] ordered + graph
- defaultEstimates per stage
- defaultRoleSkill per stage
- creationPolicy: `eager` (сразу все) | `lazy` (по триггерам) | `hybrid`

### Sprint

- name, startDate, endDate
- quarterId
- teamId?
- goal (sprint goal text)
- capacitySnapshot (зафиксированный на planning)
- status: `future | planning | active | completed | cancelled`

### Release

- name, version, date/window
- releaseTrain? (опционально)
- membership: Story[]
- readiness metrics (вычисляемые)
- status: `planned | in_progress | code_freeze | ready | released | cancelled`

### Dependency

Универсальная связь:

- fromObject (type + id)
- toObject (type + id)
- kind: `FS | SS | FF | SF` (см. документ 05)
- strength: `hard | soft`
- reason
- source: `template | manual | inferred`

### Estimate

Мультимодельная оценка:

- `story_points` — относительный размер Story
- `role_hours` — часы по RoleSkill
- `calendar_days` — длительность
- confidence: `low | medium | high`
- source: `manual | template_default | rolled_up | historical`

**Рекомендация:** для capacity planning источником истины считать **role_hours** на WorkItem; SP — для приоритизации и скорости команды.

### CapacityPlan / CapacityAllocation

См. документ 07. Суть:

- доступность Employee на период с учётом Absence и % аллокации на Product;
- агрегация в RoleSkill pools;
- сопоставление с суммой estimate role_hours запланированных Work Items.

### Team / Employee / RoleSkill

Разделение **орг. роли** (RBAC: кто может нажимать кнопки) и **исполнительского навыка** (кто делает BA/QA работу).

Один Employee может иметь несколько RoleSkill (например, SA + Arch) с весами.

---

## 2.4. Связи между сущностями (логический граф)

```
Product 1──* Quarter
Product 1──* Team
Product 1──* ProcessTemplate
Product 1──* Release
Product 1──* Epic (через Initiative/Quarter; допустим product-level backlog epic)

Quarter 1──* QuarterGoal
Quarter 1──* Initiative
Quarter 1──* Sprint

QuarterGoal *──* Initiative
Initiative 1──* Epic
Epic 1──* UserStory
UserStory 1──* WorkItem
UserStory 1──* AcceptanceCriterion
UserStory *──* Release          (через ReleaseMembership)
UserStory *──* Sprint           (assignment; обычно 0..1 активный)
WorkItem *──* Sprint            (assignment)

UserStory/WorkItem/Epic/... *──* Dependency (полиморфно)

Employee *──* RoleSkill         (EmployeeSkill)
Employee 1──* CapacityPlan
Employee 1──* Absence
WorkItem *──1 RoleSkill         (required skill)
WorkItem *──0..1 Employee       (assignee)

ProcessTemplate 1──* ProcessTemplateVersion
ProcessTemplateVersion 1──* ProcessStage
ProcessStage *──* ProcessStage  (StageDependencyRule)
UserStory *──1 ProcessTemplateVersion (applied version, immutable link)
```

---

## 2.5. Вычисляемые (derived) поля — не хранить как истину вручную

| Поле | Как считается |
|------|----------------|
| Epic.progress | % Story в terminal status / weighted by estimate |
| Initiative.health | агрегат Epic + риски + capacity pressure |
| Quarter.health | Goals + Initiatives + critical path slippage |
| Sprint.loadByRole | sum(WorkItem.role_hours) / CapacityPlan.available |
| Release.readiness | % Story done + обязательные стадии закрыты + open blockers |
| Story.blocked | exists hard dependency predecessor not satisfied |
| Story.criticalPathFlag | belongs to longest path affecting QuarterGoal/Release date |

Ручное редактирование derived-полей запрещено (только override-флаги с аудитом, если нужно).

---

## 2.6. Дополнительные сущности (рекомендуется добавить)

Помимо списка из ТЗ:

| Сущность | Зачем |
|----------|-------|
| **ProcessTemplateVersion** | Безопасное изменение шаблонов без порчи старых Story |
| **AcceptanceCriterion** | Definition of Done на уровне Story |
| **Risk / Assumption** | Явное управление неопределённостью квартала |
| **Absence** | Реалистичный capacity |
| **BacklogRank** | Стабильная приоритизация без «priority = 1..5» |
| **ActivityEvent** | Аудит и восстановление «почему так спланировали» |
| **SavedView** | Персональные доски без размножения данных |
| **WorkType** | Справочник типов работ отдельно от статусов |
| **HierarchyPolicy** | Включение/выключение Feature и др. уровней |
| **DefinitionOfReady / DefinitionOfDone Policy** | Проверяемые чеклисты на переходах |

---

## 2.7. Идентичность и мягкое удаление

- Все бизнес-сущности имеют стабильный `id` (UUID) и человекочитаемый `key` (`CKI-123`).
- Удаление по умолчанию — **archive/soft-delete**.
- Hard delete — только для черновиков без ссылок и только ролью Administrator.
- Каскадные политики описаны в документе 08.
