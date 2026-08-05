# 07. Releases · Capacity · Roadmap · Backlog

## 7.1. Release Management

### Модель

Release — **пакет поставки**, ортогональный иерархии ценности.

```
Release
  └── Story memberships (ordered / tagged: must / should / stretch)
```

Story может:

- входить в один активный Release (рекомендуемая политика);
- не входить ни в один (внутренняя тех. работа / ещё не намечена поставка);
- переезжать между planned releases до code_freeze.

### Как Story попадает в релиз

1. Плановое включение PM при shaping.
2. Автопредложение: Story с component/version label.
3. Hotfix path: отдельный patch release.

Операция `Add to Release` проверяет:

- совместимость сроков с зависимостями;
- не нарушен ли freeze;
- impact на readiness %.

### Готовность релиза (Readiness)

Составной индикатор:

| Gate | Формула / правило |
|------|-------------------|
| Scope complete | must-Story в `done` или waived |
| Quality | mandatory QA WorkItems done; open defects policy |
| Dependencies | no open hard blockers on release critical path |
| Docs/Comms | checklist template (optional stage) |
| Risk | no unresolved High risks marked release-blocking |

**Readiness %** = weighted score gates (конфиг весов).  
Статус `ready` только при green hard gates.

### Показатели на Release view

- дата plan vs forecast vs actual
- readiness % и список красных gate
- burn-up Story/Work
- remaining role_hours by skill
- critical path length / slack
- interrupt/hotfix count after freeze
- carry-over из предыдущего релиза

### Release ≠ Done этапа Story

Отдельный WorkItem «Release Prep» может существовать в шаблоне, но **факт релиза** фиксируется объектом Release, а не колонкой на доске.

---

## 7.2. Capacity Planning (полноценная модель)

### Почему не только часы и не только SP

| Модель | Что даёт | Где ломается |
|--------|----------|--------------|
| Только Story Points | Скорость команды | Не видно, что SA — бутылочное горлышко |
| Только people-hours | Индивидуальная загрузка | Игнор взаимозаменяемости и ролей |
| Только headcount | Грубая рамка | Бесполезно для планирования спринта |

**Целевая модель ЦКИ — трёхслойная.**

### Слой 1. Role Pools (главный)

Пулы: Business Analyst, System Analyst, Backend, Frontend, QA, Product Manager, UX, Architect, (Tech Writer, DevOps — расширяемо).

```
Demand(role, period)   = Σ WorkItem.estimate_hours for role in period
Supply(role, period)   = Σ Employee available hours with RoleSkill × skill weight
Utilization(role)      = Demand / Supply
```

### Слой 2. People Allocations

- % времени Employee на Product;
- Absence;
- focus factor (например 0.7–0.8 на deep work vs meetings) — параметр Team;
- primary/secondary skills (secondary с понижающим коэффициентом).

### Слой 3. Story Points / Velocity (вспомогательный)

- для грубого квартального forecast и приоритизации;
- не используется как единственный сигнал overload.

### Расчёт реальной загрузки (пример логики)

Для спринта 10 рабочих дней, focus factor 0.75:

```
available(person) = workdays × hours/day × productAllocation × focusFactor − absences
supply(SA) = Σ available(person) × weight(person, SA)
demand(SA) = Σ hours of SA WorkItems in sprint (committed + planned interrupt share)
```

Вывод в UI:

- utilization по ролям (бар/таблица);
- кто перегружен персонально;
- какие Story создают пик спроса;
- рекомендации: сдвинуть Story, урезать scope, привлечь secondary skill, увеличить buffer.

### Capacity на уровне квартала

До детализации всех Story:

1. Initiative задаёт **capacity envelope** (например 30% SA-квартала + 20% BE…).
2. При появлении candidate Stories с шаблонами demand уточняется bottom-up.
3. Расхождение top-down envelope vs bottom-up demand = сигнал к shaping.

### Best practices, заложенные в модель

- Планировать по constraining skill (theory of constraints).
- Держать interrupt buffer явным.
- Не планировать > ~85% supply на early planning (оставить вариативность).
- Разделять **calendar availability** и **effective capacity**.
- Историчность: после sprint completion сохранять planned vs actual hours для калибровки template defaults.

---

## 7.3. Roadmap

### Принцип

Roadmap — проекция объектов на временную ось, не отдельная «таблица Excel в системе».

### Уровни детализации

| Уровень | Объекты | Горизонт | Audience |
|---------|---------|----------|----------|
| L0 Strategy | QuarterGoals, Initiatives | 2–4 квартала | руководство |
| L1 Delivery | Epics, Releases, Milestones | текущий+след. квартал | PM/managers |
| L2 Execution | Stories, dependency bars | 1–2 спринта / текущий квартал | команда |
| L3 Work | WorkItems, critical path | текущий sprint | исполнители |

### Как строится

- ось X — Calendar (с учётом non-working days);
- полосы — Initiative/Epic/Story с forecast dates из scheduling engine;
- вертикаль — swimlanes: Goal / Initiative / Team / Component (выбор view);
- маркеры — Releases, Milestones, Quarter boundaries.

### Автообновление

Любое изменение estimate, dependency, sprint assignment, absence → пересчёт forecast end dates → обновление roadmap bars и health colors.

Ручное «подвину полоску на roadmap» допускается только как:

- изменение target dates (intent), или
- изменение планирования (assignment) через тот же write-path, что и sprint planning —

но не как «косметика без модели».

---

## 7.4. Product Backlog

### Архитектура

Backlog — это **не колонка**, а запрос к Story:

- в Product;
- не archived;
- не cancelled;
- не done;
- фильтры: без sprint / в будущем / inbox / icebox.

Сегменты (логические):

1. **Inbox** — только что созданные, `draft/refining`.
2. **Ready Backlog** — `ready`, ждут планирования.
3. **Quarter Candidates** — связаны с committed Initiative, ещё не в sprint.
4. **Icebox** — отложены осознанно (`parked`), низкий rank.
5. **Archive** — terminal done/cancelled после политики retention.

### Приоритизация

Комбинация:

- **BacklogRank** (порядок drag-and-drop, fractional index) — операционный порядок;
- **Priority** (Critical/High/Medium/Low) — класс срочности/важности;
- **Goal alignment score** (вычисляемый: связь с QuarterGoal / Initiative);
- **WSJF-like optional fields**: user value, time criticality, risk reduction, job size — не обязательно в MVP, но модель должна позволять.

Правило: rank внутри сегмента; Critical не обязан быть выше всех, если capacity/зависимости не позволяют — но должен быть видимым.

### Переход в работу

```
Inbox → Refining → Ready → (Sprint Planning) Planned/In Progress
```

DoR gate на Ready:

- понятное описание / AC;
- выбран шаблон и сгенерированы WorkItems;
- оценка на ключевых stages;
- зависимости известны или явно marked unknown risk;
- owner определён.

### Архивирование

- `done/cancelled` + возраст > N дней → auto-suggest archive;
- archive скрывает из рабочих views, доступно в поиске;
- восстановление — с правом PM/Admin.

---

## 7.5. Связка четырёх контуров

```
Backlog (что важно)
   ↓ commit
Sprint (когда делаем)
   ↓ package
Release (что поставляем)
   ↓ visualize
Roadmap (как выглядит горизонт)
```

Capacity — поперечный расчёт на всех контурах.  
Dependencies — поперечный constraint на всех контурах.
