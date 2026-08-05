# 06. Экраны — Sprint Board · Timeline · Release · Load · Kanban UX

## 6.1. Board (Kanban) — одно из представлений

**Не центр продукта.** Пункт Deliver → Board.

### Режимы

| Mode | Columns | Cards |
|------|---------|-------|
| Sprint Board | Story statuses (or Workflow columns mapping) | User Stories |
| Work Board | WorkItem statuses | Work Items (grouped by Story) |
| Team stream | same | filter by RoleSkill |

Column mapping из StatusModel → BoardColumnMapping (Saved View).

### Drag & Drop (разрешено)

- смена статуса (если transition allowed);
- reorder within column (rank — только если view = backlog-like);
- drag на другой Swimlane (Epic/Assignee) = change field.

### Drag & Drop (запрещено / с confirm)

- в статус, нарушающий hard deps → snap-back + explain toast;
- в completed sprint column;
- «перетащить на другую доску» как копирование истины.

### Автоматически (без drag)

- `planned → ready` при снятии блокеров;
- blocked column appearance;
- Story progress ring обновляется от WorkItems;
- WIP limits warn (soft).

### Операции на карточке board

Peek по клику; `S` status menu; `A` assign; `L` labels; complete via menu.

---

## 6.2. Timeline

Отдельный «раздел Calendar» **не нужен**. Timeline = режим Roadmap + слои.

Слои toggle:

- Stories / Epics / Initiatives
- Dependencies
- Releases & Milestones
- Absences (people)
- Critical path

**Редактирование вручную полосок запрещено** как paint tool.  
Inspector справа: change estimate, sprint, dependency — Timeline перестраивается.

---

## 6.3. Release Console

### Layout

```
Header: name · version · date · status · Freeze · Ship
+-------------------+------------------------------+
| Readiness ring    | Gates checklist with CTA     |
| Risk level        |                              |
+-------------------+------------------------------+
| Membership table: must / should / stretch         |
| (drag stories in · inclusion switch · waive)      |
+--------------------------------------------------+
| Remaining role hours · Critical path slack        |
+--------------------------------------------------+
```

### Быстрые действия

- `A` add story
- `F` toggle freeze (confirm)
- Open blocker from gate CTA
- Export notes (later) — не блокер UX

Показатели: readiness %, completion %, open blockers, forecast vs plan date, risk.

---

## 6.4. Load (Capacity)

### Visual language

Не spreadsheet-first. **Bars + drilldown.**

1. Period switch: Sprint / Quarter  
2. Role pool row: name · util% · bar (green/amber/red) · buffer mark  
3. Expand role → people  
4. Click segment → contributing WorkItems/Stories list (right peek)

### Parallel work visibility

Person row shows stacked assignments; overflow hashed.

### Actions

- Balance suggestion: «Move 2 SA stories to next sprint» (soft recommendation chips)
- Open Absence manager (sheet)

---

## 6.5. Risks

Список + severity.  
Filters: release-blocking, aging, capacity, external.  
Each row → linked objects + suggested action.

Также embedded mini-lists на Today и Release.

---

## 6.6. Sprint Room vs Board — разделение

| | Sprint (Plan) | Board (Deliver) |
|--|---------------|-----------------|
| Цель | commitment & load | execution flow |
| Главный жест | commit/uncommit | status transitions |
| Метрики | capacity, velocity | WIP, blocked |

PM утром может начать с Today → Sprint; команда — с Board. Одна модель.
