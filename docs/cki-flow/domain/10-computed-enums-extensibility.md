# 10. Вычисляемые поля · Enums · Расширяемость

## 10.1. Каталог вычисляемых полей

Все поля ниже **derived**. Persist-cache допустим, ручной edit — нет.

| Поле | Где | Смысл / формула |
|------|-----|-----------------|
| **Progress** | Story/Epic/Initiative/Goal | weighted % children terminal или AC/work done |
| **Completion** | Release | DoneWeight/ScopeWeight (07.4.2) |
| **Readiness** | Release | gate-weighted score |
| **Capacity / Utilization** | Role, Team, Sprint, Quarter | Demand/Supply |
| **AvailableHours** | Employee/Role period | calendar − absence × allocation × focus |
| **DemandHours** | Role period | Σ WI estimates |
| **BottleneckRole** | Sprint/Quarter | argmax utilization |
| **Velocity** | Team/Sprint | Σ SP done в sprint |
| **Burn Rate** | Quarter/Release | done / elapsed vs planned |
| **ForecastStart/End** | WI/Story/Epic | Planning Engine |
| **Estimated Finish** | alias ForecastEnd | |
| **Critical Path** | nodes/flags | Dependency Engine slack≤0 |
| **CriticalPathSlackDays** | Quarter/Release | |
| **Blocked** | Story/WI | unsatisfied hard deps ∨ explicit |
| **Health** | Goal/Initiative/Epic/Sprint/Quarter | rules engine on_track/at_risk/off_track |
| **Risk Score** | Risk/Release/Quarter | f(prob,impact) / composite |
| **TemplateDeviation** | Story | flag from rules (semi-derived) |
| **DoR/DoD Satisfied** | Story | checklist gates |
| **OpenBlockersCount** | Story/Release/Quarter | |
| **InterruptBurnRatio** | Sprint | used buffer / buffer |
| **EnvelopeUtilization** | Initiative | demand vs envelope |
| **CarryOverCandidates** | Sprint | not done committed stories |
| **IsOnCriticalPath** | WI/Story | membership in critical set |
| **isSatisfied** | Dependency | by kind vs predecessor state |
| **ContributingStoryCount** | Goal | linked graph count |
| **RemainingRoleHours** | Story/Release | Σ not done estimates |

---

## 10.2. Enumerations (канон)

Где нужна расширяемость без релиза ядра — предпочитать **справочник** (WorkType, RoleSkill, StatusDefinition). Ниже — системные enums/коды.

### StoryType
`feature | enhancement | bugfix | spike | documentation | integration | infrastructure | other`

### WorkItemOrigin
`template | manual`

### CreationPolicy
`eager | lazy | hybrid | on_previous_done | manual`

### DependencyKind
`FS | SS | FF | SF`

### DependencyStrength
`hard | soft`

### DependencySource
`template | manual | inferred`

### EstimateType
`story_points | role_hours | calendar_days`

### EstimateSource
`manual | template_default | rolled_up | historical`

### EstimateConfidence
`low | medium | high`

### PriorityCode (default)
`critical | high | medium | low`

### ReleaseType
`major | minor | patch | hotfix`

### ReleaseInclusion
`must | should | stretch`

### RiskType
`schedule | dependency | capacity | technical | external | scope | quality`

### RiskStatus
`identified | assessing | mitigating | accepted | closed | realized`

### InitiativeType (optional classifier)
`growth | compliance | tech_debt | discovery | platform | customer`

### EpicType (optional)
`delivery | enabler | research`

### AbsenceType
`vacation | sick | training | other`

### HealthStatus
`on_track | at_risk | off_track`

### PlanSnapshotType
`sprint_plan | quarter_plan | roadmap | release_scope`

### ChangeType
`create | update | delete | status | link | assign | system | override`

### AccessRoleCode (default set)
`Administrator | Manager | ProductManager | BusinessAnalyst | SystemAnalyst | Developer | QA | UX | Architect | Observer`

### NotificationChannel
`in_app | email` (extensible)

### StatusCategory
`todo | in_progress | blocked | done | cancelled`

### Default Status sets
См. архитектуру `03-lifecycles.md` — как default StatusModels:
- UserStory, WorkItem, Epic, Initiative, Quarter, Sprint, Release, QuarterGoal, WorkflowTemplate, Risk

---

## 10.3. Модель расширяемости

### Добавить новый тип задачи (WorkType)
1. Создать WorkType + default RoleSkill.
2. Использовать в новом/существующем WorkflowStage.
3. CapacityEngine подхватит через RoleSkill автоматически.

### Добавить новый Workflow
1. WorkflowTemplate + Version + Stages + Rules.
2. TemplateSelectionRule.
3. Без изменения движков.

### Добавить команду / роль skill
1. Team / RoleSkill / EmployeeSkill / Membership.
2. Calendar/FocusPolicy optional.

### Добавить Access Role
1. AccessRole + Permissions.
2. Membership bind.

### Добавить поле
1. CustomFieldDefinition на entityType.
2. Values на экземплярах.
3. Может участвовать в SavedView filters.

### Добавить сущность
1. EntityTypeRegistration (polymorphic refs).
2. StatusModel.
3. Разрешить как PlanningObject при необходимости (Dependency/Estimate).
4. Projections/views — отдельно.

### Добавить уровень иерархии
HierarchyPolicy (Feature already optional). Новый уровень — по тому же паттерну aggregation + policy flag.

### Что нельзя «просто конфигом» (осознанно)
- Замена математики Capacity/Critical Path — это версия доменного ядра.
- Отключение инварианта DAG hard-deps.

---

## 10.4. Антипаттерны расширяемости (запрещены моделью)

1. Колонки доски как источник новых статусов без StatusModel.
2. Дублирование Tag и Label.
3. Хранение Progress вручную «для удобства отчёта».
4. Плоские custom status strings вне StatusModel.
5. Шаблоны без версий (mutable process in place).
