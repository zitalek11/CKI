# 04. Пользовательские сценарии (оптимальный UX)

Для каждого сценария: цель → вход → шаги → ускорители → защита от ошибок.

---

## 4.1. Планирование квартала

**Цель:** зафиксировать Goals, committed Initiatives, capacity envelope.  
**Вход:** Plan → Quarter / ⌘K `Plan Quarter`.

**UX-поток:**

1. Экран Quarter открывается в режиме **Cockpit**: Goals strip + Health + Role Load forecast.
2. PM создаёт Goal через inline (`G` или `+ Goal`) — 2 поля: statement + metric.
3. Создаёт Initiative из Goal (`I`) или из palette — side peek с outcome + envelope sliders по ролям.
4. Система показывает **Demand vs Supply** по мере добавления candidate Stories/Epics.
5. Кнопка **Commit Plan** → diff baseline → confirm → PlanSnapshot.

**Ускорители:** duplicate previous quarter skeleton; suggest envelopes from history.  
**Защита:** нельзя Commit при hard overload без override+reason.

---

## 4.2. Планирование спринта

**Вход:** Plan → Sprint / `⌘K Sprint Planning`.

**UX:** split view.

| Left | Right |
|------|-------|
| Ready Backlog (filtered) | Sprint commitment list |
| | Role Load bars live |
| | Dependency warnings |

Действия: `Enter` / drag → commit; `⌫` → uncommit.  
Шапка: Capacity / Velocity last 3 / Interrupt buffer remaining / Risk chips.

**Оптимум:** commit Story за 1 жест; увидеть load change мгновенно (<100ms ощущение).

---

## 4.3. Создание инициативы

**Вход:** `⌘N` в Quarter / `C then I` / palette `Create Initiative`.

**Quick Create (не форма на 2 экрана):**

1. Title
2. Outcome (1–2 предложения)
3. Linked Goal(s) chips
4. Envelope (optional collapse)

Save → Peek Initiative. Epics добавляются следом inline.

---

## 4.4. Создание Epic

Из Initiative page: `E` или `+ Epic` в дереве.  
Поля: title, outcome optional, owner.  
Сразу виден пустой children state с CTA «Add Story».

---

## 4.5. Создание User Story + автогенерация задач

**Самый важный happy path.**

1. `⌘N` / `C then S` → Quick Create Story.
2. Title + StoryType (segmented) → шаблон выбирается автоматически (пояснение: «API template»).
3. Submit.
4. **Micro-success:** toast + Peek открывается; секция Work показывает skeleton→items appearing (stagger 30–50ms) — «создано 6 работ, зависимости построены».
5. PM уточняет estimates inline в таблице Work; не обязан открывать каждую задачу.

**Минимум кликов:** 2 (открыть create + submit), тип можно сменить стрелками до submit.

---

## 4.6. Управление зависимостями

**Поверхности:**

- Story Peek → вкладка Dependencies (list + mini graph).
- Глобально: Roadmap → Dependencies overlay / Insights → Risks.
- `D` на story → add dependency picker (typeahead object + kind FS/SS…).

**UX:** при создании template deps уже есть (read-only group «From template») + manual group.  
Critical path подсвечивается amber chain; click node → Peek.

Перетаскивание на graph **не** рисует «косметику» — создаёт Domain Dependency с валидацией цикла.

---

## 4.7. Перепланирование спринта

Режим **Replan** на Sprint page (`⇧⌘R`):

1. Перед изменениями — snapshot hint.
2. Multi-select stories → Move to Sprint…
3. Preview panel: capacity delta, broken deps, critical path delta.
4. Confirm → one PlanRevision toast «Sprint replanned · Undo».

Undo 30–60 сек для mass ops.

---

## 4.8. Перепланирование квартала

Plan → Quarter → **Replan wizard-lite** (1 экран, не wizard):

- scope changes (initiatives cut/add);
- envelope adjust;
- affected sprints list;
- before/after health.

Confirm → PlanRevision + Snapshots.  
Никакого «перерисуй доску руками».

---

## 4.9. Управление релизом

Releases → Release Console:

- membership table (must/should/stretch) drag from backlog/palette;
- Readiness ring + gate list (green/red with fix CTA);
- Risk score;
- Freeze toggle with confirm.

Add Story: `A` typeahead. Waive must: reason drawer.

---

## 4.10. Анализ загрузки команды

Insights → **Load**:

- Role pool bars (BA/SA/BE/FE/QA…);
- People rows expandable;
- Period: Sprint / Quarter toggle;
- Click overload bar → stories contributing demand (drill-down).

Один взгляд = bottleneck role + list «что вырезать».

---

## 4.11. Анализ рисков

Insights → Risks + сигналы на Today.

Типы карточек сигнала: release risk, blocker aging, capacity, external dep, scope creep.  
Каждый сигнал: why · impact · suggested action (button).

---

## 4.12. Просмотр Roadmap

Deliver → Roadmap:

- Zoom L0/L1/L2;
- Swimlane: Goal / Initiative / Team;
- Bars auto from forecasts;
- Click bar → Peek;
- Timeline mode toggle (та же страница).

Ручное «подвинь бар» = изменение target date / assignment через confirm sheet, не silent paint.

---

## 4.13. Работа с Backlog

Deliver → Backlog:

- densе table + optional board-lite;
- filter chips, `⌘F` in-view find;
- drag rank;
- bulk: set priority, epic, sprint, release, label;
- keyboard: `J/K` move, `X` select, `S` status.

Inbox / Ready / Quarter Candidates / Icebox — сегменты сверху, не отдельные apps.

---

## 4.14. Сводная матрица «скорости»

| Сценарий | Целевое время опытного PM |
|----------|---------------------------|
| Create Story + works generated | < 15 сек |
| Commit Story to sprint | < 3 сек |
| See team bottleneck | < 5 сек (открыть Load) |
| Move 5 stories between sprints with preview | < 30 сек |
| Find any object | < 3 сек (⌘P) |
| Open Today and know if quarter at risk | < 10 сек |
