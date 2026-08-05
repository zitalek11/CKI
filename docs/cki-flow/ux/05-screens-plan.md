# 05. Экраны — Today · Plan · Backlog · Roadmap

## 5.1. Today (главный экран)

**Заменяет классический Dashboard.**  
Сразу после открытия PM видит **что требует решения**, а не KPI-стену.

### Структура (один экран, 3 зоны)

```
+------------------------------------------------------+
| Good morning · Q3 · Sprint 4 · Health: At risk       |
+------------------+-----------------------------------+
| Needs decision   | Continue                          |
| (signal cards)   | recent objects / drafts           |
+------------------+-----------------------------------+
| One-click actions: New Story · Plan Sprint · Load    |
+------------------------------------------------------+
| Quiet pulse: Goals progress · Release readiness      |
+------------------------------------------------------+
```

### Что видно сразу

| Блок | Содержание |
|------|------------|
| Context strip | Active Quarter, Sprint, overall Health chip |
| Needs decision | max 5–7 сигналов (blocker, overload, release risk, DoR stuck, interrupt buffer) |
| Continue | last 5 objects + unfinished Quick Creates |
| Quiet pulse | 3 compact meters: Goals, Sprint load bottleneck, Next release readiness |

### One-click actions

- New Story (`⌘N`)
- Open Sprint Planning
- Open Load
- Review Release (если risk high)

### Автопредупреждения

Появляются как signal cards (не модалки):

- Quarter at risk (critical path / goal health)
- Role overload > threshold
- Dependency blocked > N days
- Release gates red
- Interrupt buffer exhausted

Клик по сигналу → объект + suggested action.

**Почему не Dashboard:** дашборд провоцирует наблюдение; Today провоцирует действие.

---

## 5.2. Plan → Quarter

### Layout

1. **Header:** Quarter name · status · Commit/Replan · Health
2. **Goals strip:** horizontal cards with health + progress
3. **Main:** Initiatives table/kanban-lite with envelope utilization
4. **Right rail (collapsible):** Role supply vs demand, open risks

### Ключевые взаимодействия

- Inline create Goal / Initiative
- Expand Initiative → Epics → Story counts
- Click Initiative → Peek (full page optional)
- Commit Plan with diff sheet

---

## 5.3. Plan → Sprint

См. также сценарий 4.2. Экран-детали:

### Header metrics (не карточки-статы ради статов)

Компактная meter-line:

`Load SA 112% · BE 78% · Buffer 40% · Velocity 34/38 · Dep warnings 2`

### Body: two-pane planner

- Left: Ready backlog (rank, estimate, deps icon)
- Right: Sprint committed (groups by Epic optional)
- Bottom drawer optional: dependency mini-map for selected

### Быстрые действия

| Action | How |
|--------|-----|
| Commit | Enter / drag / `⇧⌘→` |
| Uncommit | Delete / drag back |
| Open Story | Space peek / Enter full |
| Split work across sprints | on Story Peek → Work table → move WI |

---

## 5.4. Backlog

### Лучший интерфейс для PM

**Dense table-first** (Linear-like), не карточки.

Колонки default:

`Key · Title · Type · Priority · Rank · Epic · SP · Role hours · Status · Release · Updated`

### Поиск / фильтр / сорт

- `⌘F` — find in current list
- Filter chips: Type, Status segment, Label, Component, Owner, Has risk, No estimate
- Saved filters as Views
- Sort: Rank (default), Priority, Updated, Business value
- Rank drag handle в Compact mode всегда доступен

### Массовые операции

Multi-select (`X` / Shift-click) → floating bulk bar:

Assign Epic · Move Sprint · Add Release · Priority · Label · Workflow (if draft) · Archive

Preview count + Undo.

### Сегменты

`Inbox | Ready | Quarter candidates | Icebox` — segmented control.

---

## 5.5. Roadmap

### Уровни детализации

| Level | Shows | Default audience |
|-------|-------|------------------|
| L0 | Goals + Initiatives | leadership sync |
| L1 | Epics + Releases + Milestones | PM weekly |
| L2 | Stories (filtered) | deep planning |

### Навигация между уровнями

- Zoom control `+`/`-` или `1/2/3`
- Double-click Initiative bar → L1 focused swimlane
- Click Epic → Peek; `⌘Enter` → Initiative full page hierarchy
- Breadcrumb zoom context

### Автообновление

Bars берутся из forecast dates Domain Model.  
Цвет = Health/status. Critical path overlay toggle.

### Timeline mode

Тот же экран, переключатель **Roadmap | Timeline**:

- Timeline = более точная временная шкала Work/Story с dependency lines;
- **read-only positioning** (нет ручного «порисовать гант ради скрина»);
- изменение срока = edit estimate/assignment/target через inspector.

Calendar markers: milestones, release dates, sprint boundaries, absences (optional layer).
