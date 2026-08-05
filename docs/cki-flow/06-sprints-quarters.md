# 06. Спринты и квартальное планирование

## 6.1. Связь Quarter ↔ Sprint

```
Quarter (например Q3 2026)
  ├── Sprint 1
  ├── Sprint 2
  ├── Sprint 3
  ├── Sprint 4
  ├── Sprint 5
  └── Sprint 6  (часть команд использует 2-week sprints → ~6–7 на квартал)
```

Правила:

- Sprint принадлежит ровно одному Quarter (для отчётности ЦКИ).
- Допускается sprint, пересекающий границу квартала, только как exception с явной пометкой; лучше выравнивать границы.
- Quarter planning оперирует **инициативами и capacity envelope**, sprint planning — **Story/Work commitment**.

---

## 6.2. Архитектура управления спринтами

### Как задачи попадают в спринт

Входные пути:

1. **Sprint Planning commit** — PM/Team тянут Story из prioritized backlog в Sprint.
2. **Carry-over** — незавершённые Story из предыдущего sprint (с явного решения, не автоматически молча).
3. **Interrupt intake** — срочные задачи через буфер (см. ниже).

На уровне данных:

- создаётся `SprintAssignment(storyId, sprintId, committedAt, committedBy)`;
- WorkItems по умолчанию наследуют sprint Story;
- допускается split: часть WorkItem в sprint N, часть в N+1 (например BA в S1, Dev в S2) — мощный приём для аналитического конвейера ЦКИ.

**Улучшение относительно «Story целиком в одном спринте»:**  
для команды с длинным BA→SA→Dev→QA конвейером **split work across sprints** должен быть нормальной практикой, а не исключением. Иначе спринт всегда будет врать.

### Как исключаются

- Uncommit из sprint → Story возвращается в backlog с сохранением rank (или в «parking» текущего квартала).
- Если WorkItem already `in_progress` — требуется reason + предупреждение о потерянной capacity.
- Нельзя uncommit из `completed` sprint (история иммутабельна); только note «было committed».

### Как переносятся

Операция `Move to Sprint`:

1. Проверка зависимостей (pred/succ timing).
2. Пересчёт sprint load by role.
3. Пересчёт forecast дат и critical path.
4. ActivityEvent + уведомление assignee/PM.

Массовый перенос (replan) — отдельный режим «Quarter Replan», с diff до/после.

### Как пересчитывается загрузка

При любом commit/uncommit/estimate change/absence change:

```
load(role, sprint) = sum(workItem.role_hours where sprint & role & not cancelled)
capacity(role, sprint) = sum(available_hours of employees with skill) - absences - non-product allocation
utilization = load / capacity
```

Пороги (конфиг):

- ≤ 85% — healthy
- 85–100% — tight
- > 100% — overload (soft block на commit по политике)

### Срочные задачи

Модель **Interrupt Buffer**:

- в каждом sprint резервируется % capacity по ролям (например 10–15%);
- срочная Story маркируется `interrupt=true`;
- если buffer исчерпан — система требует явного решения: что выкидываем из sprint (swap), а не «просто добавим».

Это заменяет хаотическое наслаивание срочности на физическую доску.

---

## 6.3. Модель квартального планирования

### Слои планирования

| Слой | Вопрос | Объекты |
|------|--------|---------|
| Strategy | Каких исходов хотим? | QuarterGoal |
| Portfolio | Какие ставки делаем? | Initiative + capacity envelope |
| Delivery shaping | Что примерно войдёт? | Epic + candidate Stories |
| Execution | Что делаем сейчас? | Sprint commitments + WorkItems |

### Процесс квартала (логический)

```
draft Quarter
  → зафиксировать Goals
  → собрать Initiatives (committed)
  → оценить demand по RoleSkill (из шаблонов candidate Stories / historical)
  → сравнить с capacity квартала
  → принять/урезать scope (envelope)
  → разложить крупные куски по sprint skeleton (грубо)
  → активировать Quarter
  → исполнять через sprint cadences
  → continuously: health & risk
  → closing: actuals vs baseline
```

### Как отслеживать выполнение целей

Для каждой QuarterGoal:

- linked Initiatives/Epics/Stories;
- progress = weighted completion;
- leading indicators: % Stories Ready, dependency aging, capacity pressure on critical roles;
- health signal: `on_track | at_risk | off_track`.

Недостаточно % done Story. Нужны **опережающие** сигналы (анализ ещё не закончен → dev не начнётся → цель под риском).

---

## 6.4. Когда квартал под риском

Система поднимает `Quarter.atRisk`, если срабатывает одно или несколько правил (конфигурируемые):

1. **Critical path slack** до Goal/Release < policy buffer.
2. **Role overload** на критических ролях > N спринтов подряд (часто SA/QA в аналитических командах).
3. **Goal progress** отстаёт от linear/planned burn с учётом оставшейся capacity.
4. **Blocked aging** — hard blockers > X дней на Stories, входящих в Goal.
5. **Scope creep** — committed envelope превышен без re-baseline.
6. **Interrupt burn** — buffer съеден рано, а входящий поток срочности высок.
7. **Template deviation spike** — много ручных исключений = процесс непредсказуем.

UX: один экран «Quarter Health» с причинами и рекомендуемыми действиями (cut scope / move / add capacity / unblock).

---

## 6.5. Baseline и перепланирование квартала

При `Initiative.committed` / `Quarter.active` фиксируется baseline:

- scope set (Initiatives/Epics/Stories keys);
- capacity assumptions;
- target milestones/releases.

Перепланирование создаёт `PlanRevision`:

- diff scope;
- diff dates;
- diff capacity;
- reason;
- approver.

Это заменяет «переписали доску и забыли, как было».

---

## 6.6. Альтернатива: чисто kanban без спринтов

**Альтернатива:** отказаться от Sprint, оставить Quarter + WIP limits.

| Плюсы | Минусы для ЦКИ |
|-------|----------------|
| Меньше ритуалов | Слабее каденция обязательств |
| Хорошо для support flow | Хуже стыкуется с квартальной отчётностью и текущей практикой доски |
| | Сложнее синхронизировать BA→Dev handoff без timebox |

**Решение:** сохранить Sprint как execution cadence, но сделать split WorkItems across sprints first-class. Kanban-view — дополнительная проекция, не замена модели.
