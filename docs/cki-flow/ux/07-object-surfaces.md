# 07. Объектные поверхности — Peek · Story · Initiative · Task Card

## 7.1. Паттерн Object Surface

Единый паттерн для всех сущностей:

| Слой | Когда | Ширина |
|------|-------|--------|
| **Quick Create** | создание | compact dialog / command form |
| **Peek** | 80% ежедневной работы | right drawer ~460px |
| **Full Page** | глубокая работа | весь canvas |

Переключение Peek ↔ Full: `⌘Enter` / кнопка Expand.

---

## 7.2. Task Card (Work Item) — compact

Используется в Board Work mode и в таблице Work на Story.

### Сразу видно

- Type icon (BA/SA/BE/FE/QA…)
- Title
- Status chip
- Assignee avatar
- Estimate hours
- Blocked icon if any
- Sprint chip (if split)

### По hover/focus

- key, remaining, dependency count
- quick actions: Start / Complete / Assign / Open

### Не на карточке

Длинное описание, полный checklist, история — только в Peek Work Item.

**Не делаем** тяжёлых «Jira cards» с 10 бейджами.

---

## 7.3. User Story — Peek (default)

### Above the fold (всегда)

1. Key + Title (editable inline)
2. Status · Priority · Type · Health/Blocked
3. Progress rail (mandatory work done)
4. Context: Epic · Initiative · Sprint · Release
5. Primary CTA: next recommended action («Start SA», «Commit to Sprint», «Unblock»)

### Секции (аккордеон / tabs)

| Tab/Section | Default |
|-------------|---------|
| **Overview** | description, business value, AC list |
| **Work** | auto-generated WorkItems table (star of the product) |
| **Deps** | template + manual + mini graph |
| **People** | owner, assignees rollup |
| **Dates** | forecast start/end, targets |
| **Activity** | comments + history (merged feed with filters) |
| **Links** | attachments, external links |

### Progressive disclosure

- Description collapsed to 3 lines;
- AC compact checklist;
- Work table shows stage icons row first; expand for estimates/assignees;
- History hidden behind Activity filter `History`.

### Work table columns

`Stage · Status · Assignee · Hours · Sprint · Blocked · •••`

Inline edit hours/assignee. Это главный инструмент после создания Story.

---

## 7.4. User Story — Full Page

Расширяет Peek до двух колонок:

- Left: Overview + AC + Comments
- Right sticky: Work pipeline vertical (BA→…→QA) with status; Deps graph larger; Release/Sprint panels

Для демо/груминга — Full Page; для triage — Peek.

---

## 7.5. Initiative — Full Page (и Peek)

### Пользователь должен видеть цепочку

```
Initiative header (outcome · health · envelope)
  └─ Epics (expandable)
       └─ Stories (counts by status + risk dots)
            └─ Work rollup (role hours remaining)
  └─ Releases touched (chips)
```

### Блоки экрана

1. **Outcome & Goals** — linked QuarterGoals
2. **Tree** — Epic → Story (virtualized)
3. **Load envelope** — demand vs reserved
4. **Risks & Assumptions**
5. **Timeline strip** — initiative forecast vs quarter
6. **Activity**

Drill-down: click Story → Peek поверх Initiative (stack), не теряя дерево.

---

## 7.6. Epic surface

Упрощённый Initiative: outcome, progress, children stories table, target release, health.  
Create Story CTA prominent empty state.

---

## 7.7. Карточка сигнала (Today)

Не объект Domain, а UX atom:

- severity color bar (не радуга)
- title (human)
- why (1 line)
- impact
- button Suggested action
- dismiss / snooze

---

## 7.8. Consistency rules

1. Одинаковые status chips везде.
2. Одинаковые key monospace.
3. Одинаковый Peek header pattern.
4. Любое поле, меняющее план, показывает side-effect hint («SA load +8h»).
