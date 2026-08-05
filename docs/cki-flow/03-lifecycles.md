# 03. Жизненные циклы сущностей

Общий принцип: у каждого типа сущности свой **StatusModel** (конечный автомат).  
Переходы имеют предусловия, побочные эффекты и права.

Обозначения:

- `→` допустимый переход
- `[rule]` предусловие
- `{effect}` побочный эффект

---

## 3.1. User Story (центральный)

```
draft
  → refining          {можно ещё менять шаблон до generate}
  → ready             [DoR checklist / acceptance criteria ≥1 / estimate present]
  → planned           [назначен Sprint или явно «в квартальный план»]
  → in_progress       [есть ≥1 WorkItem in_progress или первый stage started]
  → in_review         [опционально: демо/приёмка]
  → done              [все обязательные WorkItem terminal; AC выполнены]
  → cancelled         [из любого non-terminal; reason обязателен]
  → archived          [из done/cancelled]
```

### Особые правила

1. Переход в `ready` не требует наличия всех WorkItem в done — только готовность к планированию.
2. `in_progress` Story может оставаться, пока идёт любой обязательный этап.
3. Возврат `done → in_progress` — только с правом Manager/PM и создаёт audit event «reopened».
4. При `cancelled` открытые WorkItem переходят в `cancelled` (cascade soft).

### Сопоставление с этапами работ

Этапы (BA → SA → Dev → QA → Release prep) живут в WorkItem.  
Статус Story — **агрегат + продуктовый смысл**, не зеркало одной колонки.

---

## 3.2. Work Item

```
planned
  → ready             [предшественники hard-FS удовлетворены]
  → in_progress       [assignee optional но recommended]
  → blocked           [из ready/in_progress при активной блокировке]
  → in_review         [для типов с ревью: Dev, SA docs, etc.]
  → done
  → cancelled
```

Из `blocked → ready/in_progress` автоматически, когда блокирующие Dependency сняты.

**Нельзя** перевести WorkItem в `done`, если hard-предшественник не terminal (политика hard).

---

## 3.3. Epic

```
proposed
  → approved          [есть owner + связь с Initiative или явное исключение]
  → in_delivery       [≥1 Story planned/in_progress]
  → done              [все Story terminal (done/cancelled); cancelled не блокирует если policy ok]
  → cancelled
  → archived
```

Progress и dates — derived.

---

## 3.4. Initiative

```
idea
  → shaping           [уточнение outcome/hypothesis]
  → committed         [включена в квартальный план; capacity envelope задан]
  → executing
  → done              [Goals contribution accepted / Epics closed]
  → dropped           [отказались; reason]
  → archived
```

Переход `committed` фиксирует baseline для отслеживания риска квартала.

---

## 3.5. Quarter

```
draft
  → planning          {открыт planning mode; спринты могут быть future}
  → active            [startDate ≤ today; goals committed]
  → closing           [конец периода; добор фактических метрик]
  → closed            [immutable baseline + actuals]
```

После `closed` изменения scope только через явные amendment records (не «тихий» edit).

---

## 3.6. Sprint

```
future
  → planning          {capacitySnapshot считается}
  → active            [ровно один active sprint на Team+Product — рекомендуемая политика]
  → completed         {фиксируется velocity, carry-over candidates}
  → cancelled         [редко; Story возвращаются в backlog/следующий sprint по правилу]
```

### Политика «один активный спринт»

Для ЦКИ рекомендуется: **один active Sprint на Team**.  
Параллельные sprints усложняют capacity и воспроизводят хаос доски.

Исключение: отдельный hotfix-train (см. Release) без полноценного sprint — через `Interrupt Buffer` capacity.

---

## 3.7. Release

```
planned
  → in_progress       [есть Story в membership и начата поставка]
  → code_freeze       [опционально; новые Story не добавляются без override]
  → ready             [readiness gates green]
  → released          {фиксируется release date actual}
  → cancelled
```

Readiness gates (минимум):

- все Story в release: `done` или явно `waived` с причиной;
- нет open hard blockers на критическом пути релиза;
- обязательные WorkTypes (например QA) закрыты;
- Release notes / checklist (конфигурируемо).

---

## 3.8. Process Template

```
draft
  → review
  → published         {создаётся immutable ProcessTemplateVersion}
  → deprecated        [нельзя применять к новым Story; старые живут на своей version]
  → archived
```

Редактирование published версии запрещено — только новая version.

---

## 3.9. QuarterGoal

```
draft
  → committed
  → tracking
  → achieved
  → missed
  → cancelled
```

Health (`on_track | at_risk | off_track`) — отдельный вычисляемый/полуавтоматический индикатор, не статус.

---

## 3.10. Risk

```
identified
  → assessing
  → mitigating
  → accepted
  → closed
  → realized          [риск сбылся → может создать Impact на план]
```

---

## 3.11. Универсальный паттерн жизненного цикла планирования

Для большинства объектов планирования действует смысловая дуга:

```
создание → уточнение → планирование → исполнение → проверка/приёмка → поставка/закрытие
```

Но **нельзя** натягивать одну и ту же цепочку статусов на все сущности:  
у Sprint нет «тестирования», у Release нет «бизнес-анализа».  
Поэтому StatusModel — **per entity type**, с общей философией, не с общим enum.

---

## 3.12. Переходы и время

Каждый переход пишет `ActivityEvent`:

- who, when, from, to, reason?
- snapshot ключевых полей (для аудита перепланирования)

Это критично для разбора «почему квартал уехал» спустя месяцы.
