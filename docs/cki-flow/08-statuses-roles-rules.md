# 08. Статусы · Роли · Бизнес-правила · Ограничения

## 8.1. Система статусов (сводка)

Подробные автоматы — в [03-lifecycles.md](./03-lifecycles.md). Здесь — согласованная матрица.

| Сущность | Статусы (основные) |
|----------|-------------------|
| **UserStory** | draft → refining → ready → planned → in_progress → in_review → done / cancelled → archived |
| **WorkItem** | planned → ready → in_progress → blocked → in_review → done / cancelled |
| **Epic** | proposed → approved → in_delivery → done / cancelled → archived |
| **Initiative** | idea → shaping → committed → executing → done / dropped → archived |
| **Quarter** | draft → planning → active → closing → closed |
| **Sprint** | future → planning → active → completed / cancelled |
| **Release** | planned → in_progress → code_freeze → ready → released / cancelled |
| **QuarterGoal** | draft → committed → tracking → achieved / missed / cancelled |
| **ProcessTemplate** | draft → review → published → deprecated → archived |
| **Risk** | identified → assessing → mitigating → accepted / closed / realized |

### Правила статусной архитектуры

1. Один StatusModel на тип сущности (настраиваемый per Product).
2. Колонки доски = mapping на статусы, не наоборот.
3. Запрещены «универсальные» статусы вроде `Open/Closed` для всех типов без семантики.
4. Terminal statuses: done/cancelled/released/closed/archived/missed/dropped — по типу.
5. Агрегатные статусы родителей не редактируются вручную (кроме override с аудитом).

---

## 8.2. Роли и права (RBAC)

Разделение:

- **Access Role** — что можно делать в системе;
- **Skill Role** — какую работу исполняешь (capacity).

### Access Roles

| Роль | Назначение |
|------|------------|
| **Administrator** | Конфигурация Product, StatusModel, Templates, Roles |
| **Manager** | Квартал, capacity policy, утверждение replan, override hard rules |
| **Product Manager** | Goals, Initiatives, приоритеты, sprint/release planning |
| **Business Analyst** | Story refining, BA WorkItems, AC |
| **System Analyst** | SA WorkItems, зависимости, тех. проработка |
| **Developer** | Dev WorkItems, оценки разработки, статусы исполнения |
| **QA** | QA WorkItems, quality gates |
| **UX** | UX WorkItems, design artifacts |
| **Architect** | шаблоны infra/architecture, review gates, внешние тех. зависимости |
| **Observer** | read-only + комментарии (опционально ограничить комменты) |

Один UserAccount может иметь разные Access Roles в разных Product/Team.

### Матрица прав (логически, не исчерпывающе)

| Действие | Admin | Manager | PM | BA | SA | Dev | QA | UX | Arch | Observer |
|----------|:-----:|:-------:|:--:|:--:|:--:|:---:|:--:|:--:|:----:|:--------:|
| CRUD Process Template | ✓ | ✓ | ~ | | | | | | ~ | |
| Manage Quarter / Goals | ✓ | ✓ | ✓ | | | | | | | |
| Prioritize Backlog | ✓ | ✓ | ✓ | ~ | | | | | | |
| Create Story | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | |
| Apply/Change Template | ✓ | ✓ | ✓ | ✓ | ~ | | | | ~ | |
| Sprint commit/uncommit | ✓ | ✓ | ✓ | | | | | | | |
| Edit own WorkItem status | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | |
| Edit others' WorkItem | ✓ | ✓ | ✓ | ~ | ~ | ~ | ~ | ~ | ~ | |
| Manage Release | ✓ | ✓ | ✓ | | | | | | ~ | |
| Override hard constraint | ✓ | ✓ | ~ | | | | | | | |
| View all | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Admin users/roles | ✓ | | | | | | | | | |

`~` = ограниченно / по политике Product.

### Принцип least privilege + planning authority

Исполнители свободно двигают свои WorkItems.  
Изменение квартального scope/sprint commitment — у PM/Manager.  
Это предотвращает «тихое расползание» плана, типичное для досок без прав.

---

## 8.3. Основные бизнес-правила

### BR-01. Создание User Story

При create + template:

1. Создать Story (`draft`/`refining`).
2. Применить published Template Version.
3. Создать WorkItems (hybrid policy).
4. Создать Dependency из StageDependencyRule.
5. Проставить default estimates и required RoleSkill.
6. Записать ActivityEvent.

### BR-02. Перенос User Story между спринтами

1. Валидировать не более одного active assignment.
2. Проверить зависимости (soft/hard policy).
3. Перенести assignment; work items — по правилу наследования/split.
4. Пересчитать capacity обоих спринтов.
5. Пересчитать forecast/critical path.
6. Если Story была interrupt — обновить buffer usage.

### BR-03. Удаление / отмена Epic

- Hard delete запрещён при наличии children не-draft.
- `cancel Epic`:
  - требует strategy: cancel children / move to another Epic / keep orphan;
  - default propose: orphan Stories остаются в backlog, теряют epicId;
  - Initiatives.progress пересчитывается.
- Archive только из terminal.

### BR-04. Удаление Initiative

Аналогично Epic, но тяжелее:

- нельзя cancel `committed` Initiative в `active` Quarter без Manager + PlanRevision;
- связанные Goals остаются, но contribution обнуляется с предупреждением.

### BR-05. Пересчёт зависимостей

Любое из:

- status change WorkItem/Story;
- add/remove dependency;
- estimate change;
- move sprint/release;

→ запускает Dependency Engine: readiness, blocked flags, critical path, risk signals.

### BR-06. Предотвращение ошибок пользователя

Система должна:

- блокировать циклы;
- предупреждать overload;
- не давать закрыть Story с open mandatory work;
- не давать «потерять» Story при cancel parent без стратегии;
- требовать reason на cancel/override/reopen;
- показывать diff последствий перед массовым replan.

### BR-07. Split Work across sprints

Разрешено, если:

- сумма work покрывает Story;
- зависимости между stages соблюдены по времени;
- Story.status отражает совокупный прогресс.

### BR-08. Release membership

- Story в `code_freeze` release не добавляется без override.
- Удаление Story из release после `ready` запрещено (только rollback статуса release).

### BR-09. Closed Quarter

Immutable baseline + actuals. Amendments — отдельные записи, не silent edit.

### BR-10. Template deviation

Если удалили mandatory stage — `templateDeviation=true`, Story помечается в quality of planning metrics.

### BR-11. Carry-over

Незавершённые Story не переносятся автоматически в следующий sprint.  
На `Sprint.completed` формируется список предложений; PM подтверждает.

### BR-12. Комментарии и вложения

Не влияют на статус сами по себе.  
Могут быть требуемым checklist item (например «ссылка на Confluence») через stage DoD.

---

## 8.4. Ограничения (invariants)

1. Hard dependency graph is a DAG.
2. Story.key уникален в Product.
3. Не более одного active Sprint на Team (policy default on).
4. WorkItem всегда имеет parent UserStory.
5. UserStory ссылается на immutable Template Version после apply.
6. Capacity utilization derived, not manually stored as truth.
7. Parent progress derived from children.
8. Soft-deleted entities исключаются из planning queries, сохраняются для audit.
9. Observer не меняет планирование.
10. Нельзя иметь два hard FS ребра A→B одновременно.

---

## 8.5. Политики, а не хардкод

Все числовые пороги — конфигурация Product/Team:

- focus factor;
- interrupt buffer %;
- overload threshold;
- blocker aging days;
- DoR/DoD checklists;
- whether hard-block on overload or only warn.

Это ключ к масштабированию без переписывания приложения.
