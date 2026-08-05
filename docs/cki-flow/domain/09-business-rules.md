# 09. Бизнес-правила и ограничения

Правила именованы стабильными ID для трассировки в реализации.

---

## 9.1. UserStory

### BR-US-01 Create
При создании с шаблоном обязательно выполнить ApplyWorkflow (см. 06). Без шаблона Story остаётся `draft` и не может стать `ready`.

### BR-US-02 Ready Gate (DoR)
`→ ready` только если:
- ≥1 AcceptanceCriterion;
- workflow applied;
- mandatory WorkItems существуют;
- ключевые estimates заданы (policy: BA/SA/Dev/QA as applicable);
- unknown deps явно помечены Risk/Assumption.

### BR-US-03 Done Gate (DoD)
`→ done` только если:
- все mandatory WorkItems terminal done;
- все AC satisfied или waived;
- нет unsatisfied hard inbound deps на Story.

### BR-US-04 Move Sprint
Если Story переносится:
1. снять/изменить SprintAssignment;
2. DependencyEngine.validateTiming;
3. CapacityEngine оба спринта;
4. PlanningEngine.reschedule;
5. ReleaseEngine.refresh если в release;
6. ChangeRecord + reason если in_progress;
7. события `StoryMovedBetweenSprints`.

Незавершённые WorkItems: по умолчанию наследуют новый sprint; при split — только выбранные WI.

### BR-US-05 Cancel
- reason required;
- cascade cancel open WorkItems;
- free capacity;
- membership в release: mark removed или waived policy;
- Epic progress recalc.

### BR-US-06 Reopen
`done → in_progress` только Manager/PM + reason; создаёт EntityVersion; capacity demand возвращается.

### BR-US-07 Template change
Смена/rebase шаблона — только `draft|refining` и нет in_progress WI.

---

## 9.2. WorkItem

### BR-WI-01 Start
`→ in_progress` только если hard predecessors satisfied (Ready).

### BR-WI-02 Complete
`→ done` блокируется unsatisfied hard FS/FF.

### BR-WI-03 Cancel mandatory
Требует privilege + reason; `story.templateDeviation=true`.

### BR-WI-04 Reassign
Пересчёт CapacityAllocation; reschedule personal calendar.

---

## 9.3. Epic / Initiative / Goal

### BR-EPIC-01 Cancel
Требует стратегию children:
- `cancel_stories` | `orphan_stories` | `reparent(epicId)`;
без стратегии — reject.

### BR-EPIC-02 Close
`→ done` если все children terminal (done/cancelled) согласно policy (cancelled не блокирует).

### BR-INIT-01 Drop committed
В active Quarter — Manager + PlanRevision.

### BR-GOAL-01 Commit
Требует metric или явный qualitative mode + owner.

---

## 9.4. Workflow

### BR-WF-01 Publish immutability
Published WorkflowTemplateVersion иммутабельна.

### BR-WF-02 Stage DAG
Hard StageDependencyRule образуют DAG.

### BR-WF-03 Change published process
Только новая version; существующие Story не мигрируют автоматически.

### BR-WF-04 Rebase
См. BR-US-07 + алгоритм 06.8.

---

## 9.5. Sprint / Quarter

### BR-SP-01 Single active
Не более одного active Sprint на Team+Product (если TimeboxPolicy.allowMultipleActiveSprints=false).

### BR-SP-02 Carry-over
Не автоматом; proposals после SprintCompleted; PM confirms.

### BR-SP-03 Completed immutability
Assignments completed sprint не меняются.

### BR-SP-04 Interrupt
Срочная Story потребляет InterruptBuffer; при исчерпании — обязательный swap scope.

### BR-Q-01 Closed immutability
Closed Quarter: изменения только через amendment PlanRevision.

### BR-Q-02 Health
Пересчёт при capacity overload, critical slack, blocker aging, scope creep, interrupt burn.

---

## 9.6. Release

### BR-REL-01 Freeze
В `code_freeze` нельзя добавлять Story без override+reason.

### BR-REL-02 Ready
Только при green hard gates.

### BR-REL-03 Date move
Reason + PlanRevision + recalc risk/forecast + notify.

### BR-REL-04 Remove after ready
Запрещено; сначала откат статуса release.

---

## 9.7. Capacity / People

### BR-CAP-01 Absence
Регистрация Absence → recalc supply → reschedule assignee work → health signals.

### BR-CAP-02 Soft overload
Warn; commit разрешён.

### BR-CAP-03 Hard overload
Reject commit/assign без `constraint.override`.

### BR-CAP-04 Parallelism
Σ allocations(person, period) ≤ EffectiveHours(person, period) × (1+tolerance).

### BR-CAP-05 Focus
EffectiveHours всегда включает focusFactor (не игнорировать meetings).

---

## 9.8. Dependencies

### BR-DEP-01 Cycle
Hard cycle → reject create/update.

### BR-DEP-02 Soft cycle
Warn only.

### BR-DEP-03 External overdue
ExternalDependency.expectedDate < needed → Risk auto-suggest / health↓.

### BR-DEP-04 Delete dep
Пересчёт ready/blocked/critical path.

---

## 9.9. History / Versioning

### BR-HIST-01 Reason
См. список reason-required в 08.1.

### BR-HIST-02 No silent plan change
Mass replan всегда PlanRevision + Snapshots.

### BR-VER-01 Checkpoint
Статусные вехи Story/Epic создают EntityVersion.

---

## 9.10. Access

### BR-ACL-01 Observer
Read (+ optional comment); no planning mutations.

### BR-ACL-02 Override
Только Admin/Manager (и PM ограниченно) + reason + ChangeRecord.

### BR-ACL-03 Sprint commit
PM/Manager (и policy Team lead).

---

## 9.11. Глобальные инварианты (constraints)

1. Hard dependency graph is DAG.
2. WorkItem всегда имеет UserStory parent.
3. Story ссылается на immutable WorkflowTemplateVersion после apply.
4. Derived fields not user-writable.
5. key unique per Product for keyed entities.
6. Soft-deleted/archived excluded from planning queries.
7. Composition delete cascades soft; aggregation delete requires strategy.
8. Capacity utilization is calculated, not declared.
9. Board/View metadata cannot change domain status by itself.
10. Custom fields cannot shadow system field keys.
