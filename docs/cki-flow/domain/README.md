# CKI Flow — Domain Model (предметная модель)

**Этап:** Domain Modeling  
**Статус:** проектирование (без кода, без UI)  
**База:** [архитектурный пакет CKI Flow](../README.md)  
**Дата:** 2026-08-05

---

## Назначение

Этот пакет фиксирует **единственный источник истины** предметной области CKI Flow.

Любой экран, Kanban, Roadmap, отчёт, диаграмма зависимостей и capacity-view в будущем строятся **только** как проекции этой модели.

На данном этапе запрещены: код, SQL, UI, React/TS/Backend.

---

## Состав пакета

| # | Документ | Содержание |
|---|----------|------------|
| 01 | [Каталог сущностей](./01-entity-catalog.md) | Окончательный список, группировка, naming decisions |
| 02 | [Спецификации: ценность и поставка](./02-entity-specs-delivery.md) | Product…UserStory…WorkItem…Release |
| 03 | [Спецификации: процесс, орг, capacity](./03-entity-specs-process-org.md) | WorkflowTemplate, Team, Capacity, Calendar… |
| 04 | [Спецификации: классификация, коллаб, доступ, meta](./04-entity-specs-meta.md) | Status, Label, History, Versioning, RBAC, Custom Fields |
| 05 | [Связи и UML](./05-relationships-uml.md) | O2O/O2M/M2M, композиция, агрегация, Mermaid |
| 06 | [Workflow Template и генерация задач](./06-workflow-generation.md) | Конфигурируемые процессы, auto-create WorkItems |
| 07 | [Engines](./07-engines.md) | Dependency · Capacity · Planning · Release |
| 08 | [History, Versioning, Events](./08-history-versioning-events.md) | Аудит, snapshots, business events |
| 09 | [Business Rules и ограничения](./09-business-rules.md) | Полный каталог правил |
| 10 | [Computed fields, Enums, расширяемость](./10-computed-enums-extensibility.md) | Вычисляемые поля, перечисления, extension model |
| 11 | [Event flows и обоснование](./11-event-flows-decisions.md) | Сквозные сценарии + ADR |

---

## Канонические решения именования

| Канон Domain Model | Синоним из ТЗ / разговора | Решение |
|--------------------|---------------------------|---------|
| **WorkItem** | Task | Канон = WorkItem (Task — alias в UI-словаре позже) |
| **WorkflowTemplate** | ProcessTemplate / Task Template | Канон = WorkflowTemplate (заменяет ProcessTemplate) |
| **QuarterGoal** | Goal / Objective | Goal = QuarterGoal; Objective — не отдельная сущность |
| **Label** | Tag | Одна сущность Label; Tag не дублируем |
| **ChangeRecord** | History | История изменений = ChangeRecord |
| **PlanSnapshot** | Roadmap/Sprint Plan Snapshot | Версии планов |
| **Feature** | Feature | Опциональный уровень (HierarchyPolicy) |

Архитектурный документ `02-domain-model.md` остаётся концептуальным; **этот пакет — нормативная спецификация** для реализации.

---

## Инварианты модели (кратко)

1. Источник истины — объекты и связи, не представления.
2. UserStory — центр поставки ценности.
3. WorkItems создаются из WorkflowTemplateVersion (immutable).
4. Sprint / Release / Capacity — ортогональные измерения.
5. Hard-зависимости образуют DAG.
6. Derived-поля не редактируются вручную.
7. Расширение — через справочники, шаблоны, Custom Fields, HierarchyPolicy — без смены ядра.
