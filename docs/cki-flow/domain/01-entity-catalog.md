# 01. Окончательный каталог сущностей

## 1.1. Принцип отбора

Сущность включается в модель, если:

- имеет собственный жизненный цикл **или**
- является first-class связью с атрибутами **или**
- нужна для инвариантов планирования/capacity/аудита.

Не включаются: колонки доски, «карточки», UI-only DTO, отчёты как объекты хранения.

---

## 1.2. Полный список (канон)

### A. Identity & Tenancy

| Сущность | Кратко |
|----------|--------|
| **Product** | Контейнер учёта / продукт |
| **UserAccount** | Учётная запись |
| **AccessRole** | RBAC-роль |
| **Permission** | Право |
| **Membership** | Участие User в Product/Team с AccessRole |

### B. Value Delivery Hierarchy

| Сущность | Кратко |
|----------|--------|
| **Quarter** | Квартальный timebox |
| **QuarterGoal** | Измеримая цель квартала |
| **GoalInitiativeLink** | M:N Goal ↔ Initiative |
| **Initiative** | Продуктовая ставка |
| **Epic** | Крупный результат |
| **Feature** | Опциональный уровень между Epic и Story |
| **UserStory** | Центральный объект ценности |
| **AcceptanceCriterion** | Критерий приёмки Story |
| **WorkItem** | Атомарная работа (этап конвейера) |

### C. Workflow / Templates

| Сущность | Кратко |
|----------|--------|
| **WorkType** | Справочник типов работ |
| **WorkflowTemplate** | Шаблон процесса |
| **WorkflowTemplateVersion** | Иммутабельная версия шаблона |
| **WorkflowStage** | Этап версии шаблона |
| **StageDependencyRule** | Правило зависимости этапов |
| **StageChecklistItem** | Пункт DoR/DoD этапа |
| **TemplateSelectionRule** | Автовыбор шаблона |

### D. Timeboxes & Calendar

| Сущность | Кратко |
|----------|--------|
| **Sprint** | Итерация исполнения |
| **SprintAssignment** | Назначение Story/WorkItem в Sprint |
| **Calendar** | Рабочий календарь |
| **CalendarException** | Праздник / перенос рабочего дня |
| **Milestone** | Контрольная точка |
| **TimeboxPolicy** | Политики длины спринта, buffer, WIP |

### E. Release

| Сущность | Кратко |
|----------|--------|
| **Release** | Релизная поставка |
| **ReleaseMembership** | Story в составе Release |
| **ReleaseGate** | Gate готовности (конфиг/экземпляр) |

### F. Organization & Capacity

| Сущность | Кратко |
|----------|--------|
| **Team** | Команда |
| **Employee** | Сотрудник (профиль исполнения) |
| **RoleSkill** | Исполнительский навык/пул |
| **EmployeeSkill** | Employee ↔ RoleSkill |
| **Absence** | Отсутствие |
| **CapacityPlan** | План availability на период |
| **CapacityAllocation** | Резерв/факт на WorkItem |
| **FocusPolicy** | Focus factor / meeting load политики |

### G. Planning Graph

| Сущность | Кратко |
|----------|--------|
| **Dependency** | Универсальная зависимость |
| **ExternalDependency** | Внешний блокер (команда/вендор/решение) |
| **Estimate** | Оценка (мультимодель) |
| **Priority** | Справочник приоритета |
| **BacklogRank** | Порядок в бэклоге |
| **Risk** | Риск |
| **Assumption** | Допущение планирования |
| **PlanRevision** | Формальное перепланирование |
| **PlanSnapshot** | Snapshot плана (Sprint/Quarter/Roadmap) |

### H. Classification & Collaboration

| Сущность | Кратко |
|----------|--------|
| **Label** | Метка |
| **Component** | Компонент продукта |
| **Link** | Произвольная ссылка на внешний/внутренний объект |
| **Comment** | Комментарий |
| **Attachment** | Вложение |
| **Notification** | Уведомление |

### I. Status & Metrics Meta

| Сущность | Кратко |
|----------|--------|
| **StatusModel** | FSM для типа сущности |
| **StatusDefinition** | Статус внутри модели |
| **StatusTransition** | Допустимый переход + guards |
| **MetricDefinition** | Определение метрики Goal |
| **MetricSample** | Замер метрики |

### J. History, Versioning, Extensibility

| Сущность | Кратко |
|----------|--------|
| **ChangeRecord** | Атомарная запись изменения поля/связи |
| **ActivityEvent** | Бизнес-событие / лента |
| **EntityVersion** | Версия содержимого сущности (Story/Epic…) |
| **CustomFieldDefinition** | Определение доп. поля |
| **CustomFieldValue** | Значение доп. поля |
| **HierarchyPolicy** | Какие уровни иерархии включены в Product |
| **EntityTypeRegistration** | Реестр типов (расширяемость) |

### K. View metadata (не источник истины планирования)

| Сущность | Кратко |
|----------|--------|
| **SavedView** | Сохранённый срез/фильтр |
| **BoardColumnMapping** | Маппинг Status → колонка view |
| **DashboardWidget** | Конфиг виджета метрик |

---

## 1.3. Что сознательно НЕ стало отдельными сущностями

| Кандидат | Решение |
|----------|---------|
| Tag | = Label |
| Objective | = QuarterGoal |
| Task | = WorkItem |
| ProcessTemplate | = WorkflowTemplate |
| History | = ChangeRecord (+ ActivityEvent) |
| Board / Column / Card | проекции, не domain entities планирования |
| Done | статус, не объект |
| Roadmap | проекция (+ PlanSnapshot для версий) |
| NotificationRule | можно добавить позже; MVP — события → Notification |

---

## 1.4. Базовые типы идентификаторов

Для всех бизнес-сущностей:

| Поле | Тип (логический) | Назначение |
|------|------------------|------------|
| `id` | UUID | Стабильный технический PK |
| `key` | string | Человекочитаемый (`CKI-142`, `REL-2.3.0`) где применимо |
| `productId` | UUID | Тенант/продуктовый scope (кроме глобальных справочников) |

Системные поля (почти везде):

| Поле | Назначение |
|------|------------|
| `createdAt` / `createdBy` | создание |
| `updatedAt` / `updatedBy` | последнее изменение |
| `archivedAt` / `archivedBy` | soft-archive |
| `rowVersion` | оптимистичная блокировка |
| `deletedAt` | soft-delete (редко; предпочтителен archive) |

---

## 1.5. Классификация связей (общая)

| Вид | Смысл в CKI Flow |
|-----|------------------|
| **Composition** | Дочерний объект не существует без родителя (AcceptanceCriterion ⊂ UserStory; WorkflowStage ⊂ TemplateVersion) |
| **Aggregation** | Родитель группирует, дочерний может быть перенесён (Epic aggregates Stories) |
| **Association** | Слабая/ортогональная связь (Story ↔ Sprint, Story ↔ Release) |
| **Inheritance** | Логическое: PlanningObject (абстрактный) ← UserStory/WorkItem/Epic… для Dependency targets |

Абстрактный тип **PlanningObject** не хранится как таблица-сущность обязательно; это polymorphic contract для Dependency/Estimate/ChangeRecord.
