# 04. Шаблоны процессов (Process Template Engine)

## 4.1. Зачем

Команда ЦКИ ведёт Story через повторяемые конвейеры:

- API-функциональность;
- документация;
- интеграция;
- исследование;
- инфраструктура.

Ручное создание этапов каждый раз — источник ошибок и рассинхрона доски.

**Цель:** при создании User Story система применяет шаблон и:

1. создаёт Work Items;
2. назначает RoleSkill и default estimates;
3. строит Dependency между этапами;
4. задаёт Definition of Ready/Done для стадий.

---

## 4.2. Универсальная модель шаблона

```
ProcessTemplate
  └── ProcessTemplateVersion (immutable after publish)
        ├── ProcessStage[]
        │     - key, name
        │     - workType
        │     - requiredRoleSkill
        │     - defaultEstimate (role_hours / optional SP share)
        │     - isMandatory (bool)
        │     - creationPolicy: eager | on_previous_done | on_manual
        │     - checklist[] (DoR/DoD stage-level)
        │     - wipHint / parallelizable flag
        └── StageDependencyRule[]
              - fromStageKey → toStageKey
              - dependencyKind (обычно FS)
              - strength hard|soft
```

### Пример: API Feature

| Stage | Role | Default hours | Depends on |
|-------|------|---------------|------------|
| Business Analysis | BA | 8 | — |
| System Analysis | SA | 12 | BA (FS hard) |
| Backend Development | BE | 16 | SA (FS hard) |
| Frontend Development | FE | 12 | SA (FS hard); optional SS soft with BE |
| QA | QA | 10 | BE+FE (FS hard) |
| Release Prep | PM/DevOps | 2 | QA (FS hard) |

### Пример: Documentation

| Stage | Role | Depends on |
|-------|------|------------|
| Content Draft | BA/TechWriter | — |
| Review | SA/PM | Draft |
| Publish | DevRel/PM | Review |

### Пример: Spike / Research

| Stage | Role | Depends on |
|-------|------|------------|
| Research | SA/Arch | — |
| Findings Review | PM+Arch | Research |
| Follow-up Decision | PM | Review |

(без Dev/QA обязательных стадий)

### Пример: Integration

| Stage | Role | Notes |
|-------|------|-------|
| Contract Analysis | SA | внешние зависимости как soft/hard external deps |
| Adapter Dev | BE | |
| Contract Tests | QA | |
| Partner Validation | BA/PM | может быть внешней зависимостью |

### Пример: Infra

| Stage | Role |
|-------|------|
| Design | Arch |
| Implementation | BE/DevOps |
| Security Review | Arch/Sec |
| Rollout | DevOps |
| Verification | QA |

---

## 4.3. Политики создания работ

### Eager (по умолчанию для ЦКИ)

При создании Story сразу создаются все mandatory stages.

**Плюсы:** видимость полного конвейера и capacity заранее.  
**Минусы:** «шум» будущих задач.

### Lazy

Work Item создаётся, когда предыдущий этап done (или по триггеру).

**Плюсы:** чистый backlog исполнения.  
**Минусы:** capacity квартала недооценивается.

### Hybrid (рекомендуется как целевая политика)

- Mandatory stages создаются сразу (**capacity-visible**), статус `planned`.
- Optional stages — по флагу/триггеру.
- Дальние stages можно скрывать в UI (`collapsed future work`), но учитывать в capacity.

Это лучший компромисс для квартальной предсказуемости ЦКИ.

---

## 4.4. Гибкость поверх автогенерации

Автогенерация — default, не тюрьма.

Разрешённые операции после apply:

| Операция | Условие |
|----------|---------|
| Добавить WorkItem | Любой с правом edit story |
| Удалить/cancel optional stage | До in_progress |
| Удалить mandatory | Только PM/Manager + reason; помечает templateDeviation |
| Изменить порядок/зависимости | С валидацией ацикличности |
| Заменить шаблон | Только пока Story в `draft/refining` и нет in_progress work |

Каждая Story хранит `appliedTemplateVersionId` + `templateDeviation=true/false`.

---

## 4.5. Выбор шаблона

Порядок определения:

1. Явный выбор пользователя при создании.
2. Правила автовыбора: `Component + Label + StoryType → Template`.
3. Default template продукта.

Автовыбор должен быть объясним («выбран API Feature, потому что component=API»).

---

## 4.6. Оценка из шаблона

Default estimate — **стартовая гипотеза**, не истина.

Механика:

1. Template пишет default role_hours на WorkItem.
2. Исполнитель/аналитик уточняет.
3. Story-level estimate может:
   - задаваться вручную (SP);
   - или считаться rollup (сумма role_hours / velocity mapping).

Для capacity всегда используется актуализированный WorkItem.estimate.

---

## 4.7. Версионирование и эволюция процессов

- Изменение процесса = новая Version.
- Уже созданные Story не мигрируют автоматически.
- Опциональная операция «Rebase template» для Story в `draft/refining` — пересоздаёт ещё не начатые stages.

Это защищает историчность и одновременно позволяет улучшать процессы.

---

## 4.8. Расширяемость

Новый процесс (например, «ML experiment» или «Legal review flow») добавляется как:

1. новые WorkType / RoleSkill (если нужны);
2. новый ProcessTemplate + Version;
3. правила автовыбора;
4. (опционально) новые readiness gates для Release.

**Без изменения доменного ядра.**

---

## 4.9. Альтернатива «чек-лист вместо Work Items» — отклонена как основная

**Альтернатива:** этапы как checklist на Story без отдельных WorkItem.

| Плюсы | Минусы |
|-------|--------|
| Проще UI | Нельзя назначать разные роли/спринты на этапы |
| Меньше сущностей | Capacity по ролям ломается |
| | Зависимости и критический путь грубее |

**Решение:** WorkItem как first-class. Checklist — дополнение внутри stage, не замена.
