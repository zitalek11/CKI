# CKI Flow — план итеративной разработки

Разработка идёт **строго по этапам**. Каждый этап должен быть рабочим и проверяемым.

## Порядок этапов

| Этап | Цель | Статус |
|------|------|--------|
| **1** | Каркас приложения (Tauri/React/FSD/Shell/Theme) | **done** |
| **2** | Domain Layer (типы, инварианты, чистые функции) | **done** |
| **3** | Storage + Repository (локальное хранение, порт на сервер позже) | **done** |
| **4** | Основные сущности + demo seed | **done** |
| **5** | Автогенерация WorkItems из User Story | **done** |
| **6** | Workflow Engine (templates/versions/apply) | **done** |
| **7** | Dependency Engine (cycle + ready/blocked) | **done** |
| **8** | Planning Engine | **done** |
| **9** | Capacity Engine (demand + supply) | **done** |
| **10** | Основные экраны по UX | **done** |
| **11** | Analytics | **done** |
| **12** | Import / Export | **done** |
| **13** | UI polish (Command Palette, settings) | **done (core)** |
| **13.5** | Migration Wizard (PDF/JSON → domain) | **done** |
| **14** | macOS `.dmg` сборка | **ready** — конфиг + CI; артефакт на macOS / Actions |
| **1.1 (PI 1.1)** | Расширение домена + Team/Sprint/Quarter управление, DnD доска, Story Peek | **done** |

## PI 1.1 — что добавлено

- **Domain**: `Employee` (hoursPerDay/workDaysPerWeek/maxLoadPercent/color/jobTitle), `UserStory`
  (asA/iWant/soThat/priority/targets), `WorkItem` (description/goal/expectedResult/spentHours),
  `Absence`, `DefinitionOfDoneItem`, `EstimationTemplate`, `Comment`, `Attachment`, `ObjectLink`,
  `RecentObject`, `Product.activeQuarterId/activeSprintId`. `DomainDatabase` версии 2 +
  `migrateDatabase()`.
- **BoardService.moveStory** — переходы вперёд/назад; после смены статуса пересчитывает прогноз
  (`scheduleWorkItems`).
- **BoardPage** — DnD между колонками (`@dnd-kit`) + кнопки-переходы.
- **TeamService** — CRUD сотрудников, отсутствия. Экран **Команда**.
- **SprintService / SprintPage** — manager: create/activate/close/archive/copy/carryOver + planning.
- **QuarterService / QuarterPage** — manager: create/activate/archive/copyStructure/carryOver.
- **AppTopbar** — селекторы квартала/спринта + быстрый переход к активному релизу.
- **Навигация** — хлебные крошки, лента недавних объектов (`NavigationService`).
- **TemplatesPage** — редактирование этапов workflow + CRUD шаблонов оценки.
- **CreateStoryForm** — карточка US + выбор workflow/estimation/sprint/epic/initiative/release.
- **Story Peek** — карточка US + задачи, AC, DoD, комментарии.
- **TodayPage** — квартал/спринт, Capacity, перегруженные сотрудники, релиз, блокирующие зависимости.
- **Capacity** — hoursPerDay, workDaysPerWeek, maxLoadPercent, absences.

## Рабочие экраны

Сегодня · Квартал · Спринт · Бэклог · Доска · Дорожная карта · Релизы · Загрузка · Риски · Пульс ·
Команда · Шаблоны · Миграция · Настройки

UI приложения — на русском языке (навигация, экраны, команды, статусы).

## Архитектура слоёв

```
Presentation (React / FSD pages-widgets-features)
    ↓
Application (services, ports)
    ↓
Domain (entities, rules, engines — pure)
    ↓
Infrastructure (storage adapters, seed, unit of work)
```

## Сборка DMG (этап 14)

См. [`BUILD.md`](./BUILD.md).

- Локально (macOS): `npm run build:dmg`
- CI: Actions → **CKI Flow — macOS DMG** (`workflow_dispatch`) или тег `cki-flow-v*`

## Следующие улучшения (после PI 1.1)

- Critical path visualization (React Flow)
- Tauri FS persistence вместо LocalStorage
- Apple Developer ID signing + notarization для публичной раздачи
- Draft-версии шаблонов процессов (сейчас правки идут в опубликованную версию — MVP-упрощение)
