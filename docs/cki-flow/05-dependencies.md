# 05. Механизм зависимостей

## 5.1. Принцип

Зависимости — рёбра графа между планируемыми объектами.  
Граф должен быть:

- ацикличным для hard-зависимостей;
- валидируемым при каждом изменении;
- визуализируемым (критический путь, blockers).

Зависимости создаются:

1. **автоматически** из Process Template;
2. **вручную** пользователем;
3. **опционально inferred** (например, общая компонента + конфликт ресурсов) — только soft, с пометкой.

---

## 5.2. Типы зависимостей

### По семантике времени (классика scheduling)

| Kind | Смысл | Типичное применение |
|------|-------|---------------------|
| **FS** Finish-to-Start | B нельзя начать, пока A не завершён | BA → SA → Dev → QA |
| **SS** Start-to-Start | B нельзя начать, пока A не начат | FE может стартовать вместе с BE после SA |
| **FF** Finish-to-Finish | B нельзя завершить, пока A не завершён | Docs finish вместе с Feature finish |
| **SF** Start-to-Finish | редко; B не может закончиться до старта A | почти не использовать в UI по умолчанию |

Для ЦКИ default и 95% случаев — **FS**.

### По силе

| Strength | Поведение |
|----------|-----------|
| **hard** | Блокирует недопустимые переходы статуса; участвует в critical path |
| **soft** | Предупреждение; не блокирует; видно в risk signals |

### По уровню объектов

Зависимости допустимы между:

- WorkItem ↔ WorkItem (основной граф исполнения)
- UserStory ↔ UserStory (продуктовые зависимости)
- Epic ↔ Epic (грубое квартальное планирование)
- UserStory ↔ ExternalDependency (внешние команды/вендоры — см. ниже)
- Milestone/Release ↔ Story (gate)

**Ограничение:** запрещены зависимости «через этажи» без нужды (WorkItem → Epic напрямую) — усложняют граф. Разрешить только Story↔Story и Work↔Work + cross-type gates к Release/Milestone.

---

## 5.3. External Dependency

Отдельный объект или тип Dependency:

- ожидание API от другой команды;
- закупка/доступ;
- решение Architecture Board;
- юридическое согласование.

Поля: owner, expectedDate, status, escalation.

External hard dependency делает Story `blocked` и влияет на риск квартала.

---

## 5.4. Автоматические проверки невозможности

При любой операции (смена статуса, перенос в sprint, изменение дат/оценок) система проверяет:

### Hard checks (reject / block transition)

1. **Cycle detection** — hard-граф не должен содержать циклов.
2. **FS predecessor not done** — нельзя начать successor WorkItem.
3. **Story в двух active sprint** — запрещено.
4. **Release code_freeze** — нельзя добавить Story без override.
5. **Closed Quarter immutability** — нельзя менять baseline без amendment.
6. **Template mandatory stage missing** — нельзя Story → done.

### Soft checks (warn)

1. Successor sprint earlier than predecessor finish forecast.
2. Role capacity > threshold (например 100% / 120%).
3. Story без estimate в committed initiative.
4. Critical path slack < buffer policy.
5. Assignee отсутствует на обязательном stage при planning complete.

---

## 5.5. Блокирующие задачи

WorkItem/Story считаются **blocked**, если:

- существует входящая hard dependency с неудовлетворённым условием; или
- статус явно `blocked` с reason (даже без dependency — «ожидаем уточнение от бизнеса»).

UI/проекции обязаны показывать:

- who/what blocks;
- since when;
- unblock condition;
- impact (какие downstream объекты и даты под угрозой).

---

## 5.6. Критический путь

### Определение для ЦКИ

Критический путь —最长ший (по прогнозной длительности) путь hard-зависимостей, определяющий достижение:

- даты Release; и/или
- даты окончания Quarter / QuarterGoal.

### Расчёт (логически)

1. Взять граф WorkItems (и Story-level edges, развёрнутые до work) в scope (Quarter или Release).
2. Использовать оценки длительности (role_hours → calendar days через capacity календаря роли/assignee).
3. Forward pass: earliest start/finish.
4. Backward pass: latest start/finish.
5. Slack = LS − ES; critical = slack ≤ threshold (обычно 0).

### Отображение

- на Roadmap/Dependency view подсветка critical chain;
- на Quarter dashboard: «N дней buffer осталось»;
- при переносе Story — delta критического пути («+3 дня к релизу»).

**Важно:** критический путь пересчитывается автоматически; не ведётся вручную как на физической доске.

---

## 5.7. Лаги и буферы

Dependency может иметь `lagDays` (например, FS + 2 дня на ревью партнёра).

Буферы квартала:

- **Interrupt buffer** — % capacity на срочные задачи;
- **Integration buffer** — перед релизом;
- **Discovery buffer** — для spike-результатов, меняющих scope.

Буферы — first-class в CapacityPlan, не «скрытый жирок в оценках».

---

## 5.8. Что происходит при изменениях

| Событие | Поведение системы |
|---------|-------------------|
| Завершён predecessor | successors: `planned → ready` (если другие pred ok) |
| Переоткрыт predecessor | successors hard: обратно в blocked/planned; предупреждение |
| Удалена/отменена зависимость | пересчёт ready/critical path |
| Перенос Story в другой sprint | проверка, что predecessors успевают; иначе warn/reject по политике |
| Изменение estimate на critical node | пересчёт дат и quarter risk |

---

## 5.9. Ограничения модели зависимостей

1. Не более одного hard FS между той же парой в одном направлении (идемпотентность).
2. Запрет self-dependency.
3. Soft зависимости не участвуют в cycle hard-check, но excess soft-cycles — warn.
4. Внешние зависимости без expectedDate помечают Goal/Initiative как elevated uncertainty.
5. Dependency не заменяет parent-child иерархию (Story→Work). Иерархия — containment; dependency — ordering/constraint.
