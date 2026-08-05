# 07. Engines — Dependency · Capacity · Planning · Release

Engines — доменные вычислители. Не UI. Не «сервисы кода», а **обязательная бизнес-логика модели**.

---

## 7.1. Dependency Engine

### 7.1.1. Типы зависимостей

| Тип | Смысл | Правило удовлетворения |
|-----|-------|------------------------|
| **FS** Finish→Start | B стартует после финиша A | A.status ∈ terminal_done |
| **SS** Start→Start | B стартует после старта A | A.status ∈ {in_progress, in_review, done} |
| **FF** Finish→Finish | B не финиширует раньше A | для перехода B→done нужен A done |
| **SF** Start→Finish | редко | B→done только после A started |
| **Blocked By** | семантический ярлык | = hard FS (или явный blocked flag) |
| **Blocks** | обратный ярлык | inverse of Blocked By |
| **Soft Dependency** | strength=soft | не блокирует переходы; warn + risk |
| **External Dependency** | через ExternalDependency | hard/soft FS к внешнему событию/дате |

### 7.1.2. Инварианты

1. Hard-граф — DAG (цикл → reject).
2. Self-deps запрещены.
3. `isSatisfied(dep)` вычисляется; не редактируется вручную.
4. Object `blocked` ⇔ ∃ unsatisfied hard inbound dep **или** explicit blocked status.

### 7.1.3. Алгоритм Ready Propagation

```
on WorkItem status change / dep change:
  for each successor S of node N:
    if all hard deps of S satisfied:
      if S.status == planned: S → ready (system transition)
      clear blocked if was dependency-blocked
    else:
      if S.status in {ready, in_progress}: mark blocked or revert to planned (policy)
  recompute critical path for affected scope
```

### 7.1.4. Critical Path

Scope: Quarter или Release.

```
duration(node) = role_hours_to_calendar_days(estimateHours, calendar, assignee|rolePool)

Forward:
  ES[node] = max(ES[pred] constraints by kind+lag, scopeStart)
  EF[node] = ES[node] + duration

Backward:
  LF[node] = min(LF[succ] constraints, scopeTargetEnd)
  LS[node] = LF[node] - duration

slack = LS - ES
critical = slack ≤ threshold (default 0)
criticalPath = nodes with critical=true forming longest chain
```

### 7.1.5. Невозможность выполнения

Reject/block когда:

- переход нарушает hard FS/FF;
- commit в sprint делает forecast нарушающим hard pred в прошлом относительно sprint start (policy hard/soft);
- cycle introduced.

---

## 7.2. Capacity Engine

### 7.2.1. Входы

- Calendar + exceptions (праздники)
- Employee.weeklyHours, productAllocationPercent
- EmployeeSkill.weight
- Absence
- FocusPolicy.focusFactor
- WorkItem.estimateHours + requiredRoleSkill + sprint/period
- TimeboxPolicy.interruptBufferPercent
- parallel work: один Employee на нескольких WorkItems — supply не размножается

### 7.2.2. Математическая модель Supply

Для периода P (sprint/quarter), сотрудника e, навыка r:

```
WorkDays(e, P) = { d ∈ P | isWorkingDay(calendar(e), d) } \ AbsenceDays(e)

BaseHours(e, P) = Σ_{d∈WorkDays} hoursPerDay(calendar, d)

AllocatedHours(e, P) = BaseHours(e, P) × productAllocationPercent(e) / 100

EffectiveHours(e, P) = AllocatedHours(e, P) × focusFactor(team)

Supply(e, r, P) = EffectiveHours(e, P) × skillWeight(e, r)

Supply(r, P) = Σ_e Supply(e, r, P)

InterruptBuffer(r, P) = Supply(r, P) × interruptBufferPercent

PlannableSupply(r, P) = Supply(r, P) - InterruptBuffer(r, P)
```

### 7.2.3. Demand

```
Demand(r, P) = Σ { wi.estimateHours |
  wi.requiredRoleSkill = r
  ∧ wi not cancelled
  ∧ period(wi) intersects P
  ∧ (committed ∨ planned_in_scope) }

Utilization(r, P) = Demand(r, P) / Supply(r, P)   # или / PlannableSupply — policy
Overload(r, P) ⇔ Utilization > overloadSoftThreshold
HardOverload(r, P) ⇔ Utilization > overloadHardThreshold
```

### 7.2.4. Параллельная работа

Demand суммируется по WorkItems; Supply не увеличивается.  
Если персональный Σ reservedHours(e) > EffectiveHours(e) → person overload (soft/hard).

### 7.2.5. Реакции

| Условие | Поведение |
|---------|-----------|
| Soft overload | warn; разрешить commit |
| Hard overload | reject commit без override (Manager) |
| Absence added | пересчёт Supply; если Demand > Supply → Quarter/Sprint health↓; список impacted WorkItems |
| Assignee set | CapacityAllocation reservedHours = estimateHours (или share) |

### 7.2.6. Командная загрузка

```
TeamUtilization(P) = Σ_r Demand(r,P) / Σ_r Supply(r,P)
BottleneckRole(P) = argmax Utilization(r,P)
```

---

## 7.3. Planning Engine

### 7.3.1. Ответственность

Расчёт `forecastStart` / `forecastEnd` для WorkItem и rollup на Story/Epic/Release/Quarter; обработка переносов.

### 7.3.2. Базовый scheduling (ASAP в рамках constraints)

```
schedule(scope):
  build hard dependency DAG
  topological order
  for node in order:
    startLowerBound = scopeStart
    for pred in predecessors:
      startLowerBound = max(startLowerBound, constraintMinStart(pred, kind, lag))
    if assignee:
      start = nextAvailableWorkingInstant(assignee, startLowerBound)
      end = addWorkingHours(assignee, start, estimateHours)
    else:
      start = nextWorkingInstant(rolePoolCalendar, startLowerBound)
      end = addWorkingHours(rolePool, start, estimateHours) // грубее
    node.forecastStart/End = start/end
  rollup parents
```

### 7.3.3. Правила переноса сроков

| Событие | Эффект |
|---------|--------|
| Изменение estimate | reschedule node + successors |
| Изменение dependency | reschedule affected subgraph |
| Absence | reschedule assignee's nodes |
| Move Story → Sprint S2 | lowerBound = S2.start; validate preds; reschedule; capacity both sprints |
| Sprint dates changed | reschedule all assignments |
| Quarter dates changed | rare; PlanRevision; reschedule milestones/goals forecasts |

### 7.3.4. Перенос спринтов / кварталов

**Sprint move (Story):**

1. Validate single active assignment.
2. Dependency timing check.
3. Capacity check target sprint.
4. Update SprintAssignment.
5. Reschedule forecasts.
6. Emit `StoryCommittedToSprint` / `StoryMovedBetweenSprints`.
7. ChangeRecord + optional PlanRevision if mass move.

**Quarter replan:**

1. Create PlanRevision.
2. Snapshot before (PlanSnapshot).
3. Apply scope/date/sprint skeleton changes.
4. Recalculate capacity envelopes vs demand.
5. Snapshot after.
6. Update Quarter.health.

### 7.3.5. Правила «невозможного плана»

Hard reject:

- forecastEnd > Release.code_freeze для must-Story при policy;
- hard dep cycle;
- Story в двух active sprints.

Soft warn:

- forecastEnd > Sprint.end;
- utilization > soft threshold;
- external dependency expectedDate > needed date.

---

## 7.4. Release Engine

### 7.4.1. Состав

`ReleaseMembership` с inclusion ∈ {must, should, stretch}.

### 7.4.2. Процент выполнения

```
w(must)=1.0, w(should)=0.6, w(stretch)=0.3   # config

ScopeWeight = Σ w(inclusion_i) for non-waived
DoneWeight  = Σ w(inclusion_i) for stories in done (or waived)

CompletionPercent = DoneWeight / ScopeWeight × 100
```

### 7.4.3. Готовность (Readiness)

Gates (конфиг ReleaseGate):

| Gate | Hard? | Условие |
|------|-------|---------|
| G_SCOPE | hard | все must done или waived |
| G_QUALITY | hard | mandatory QA WorkItems done; open defect policy |
| G_DEPS | hard | нет open hard blockers на critical path релиза |
| G_DOCS | soft/hard | checklist |
| G_RISK | hard если releaseBlocking risks open |

```
ReadinessPercent = Σ weight(gate)×score(gate) / Σ weight
Release.ready ⇔ all hard gates green
```

### 7.4.4. Риск релиза

```
ReleaseRiskScore =
  α × (1 - ReadinessPercent/100) +
  β × CriticalPathOverdueDays_norm +
  γ × OpenBlockers_norm +
  δ × CapacityOverloadOnRemainingWork +
  ε × Σ Risk.riskScore (releaseBlocking)

Level: low / medium / high / critical — by thresholds
```

### 7.4.5. Перенос релиза

`ReleaseDateMoved`:

1. reason required.
2. PlanRevision.
3. Recompute forecasts vs new date.
4. Update Milestone if linked.
5. Recalc risk/readiness.
6. Notify membership owners.

---

## 7.5. Порядок пересчёта при событии (единый pipeline)

```
Domain Change
  → validate invariants
  → persist write model
  → DependencyEngine.propagate
  → PlanningEngine.reschedule(affected)
  → CapacityEngine.recalculate(periods)
  → ReleaseEngine.refresh(affected releases)
  → aggregate health (Story/Epic/Initiative/Quarter)
  → emit ActivityEvents
  → write ChangeRecords
  → invalidate projections
```
