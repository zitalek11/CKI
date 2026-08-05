# Этап 4 — Структура проекта

## Рекомендация по репозиторию

Создать **отдельный проект** (не поверх текущего портала ЦКИ):

```
cki-report-studio/
```

Текущий workspace (`cki` portal) оставить нетронутым. Документы анализа временно лежат в `docs/cki-report-studio/` этого репозитория до выделения app.

---

## Дерево проекта (целевое)

```
cki-report-studio/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html                 # shell UI (не отчёт)
├── src-tauri/                 # Tauri 2
│   ├── tauri.conf.json
│   ├── Cargo.toml
│   └── src/
│       ├── main.rs
│       └── commands/          # fs read/write, dialogs
├── src/
│   ├── main.tsx
│   ├── app/
│   │   ├── App.tsx
│   │   ├── layout/
│   │   │   ├── Shell.tsx      # left / preview / bottom
│   │   │   └── WizardShell.tsx
│   │   └── providers.tsx
│   ├── features/
│   │   ├── editor/            # section forms, accordion, search
│   │   ├── preview/           # iframe, click-to-edit bridge
│   │   ├── wizard/            # weekly update steps
│   │   ├── history/           # report list
│   │   ├── export/            # HTML/PDF actions
│   │   ├── import/            # JSON/CSV
│   │   └── schema-admin/      # P2: add fields
│   ├── core/                  # framework-agnostic
│   │   ├── model/             # types
│   │   ├── schema/            # zod
│   │   ├── derive/
│   │   ├── format/
│   │   ├── validate/
│   │   ├── week/
│   │   ├── render/            # handlebars + helpers
│   │   └── import/
│   ├── shared/
│   │   ├── ui/                # shadcn components
│   │   ├── lib/
│   │   └── hooks/
│   └── stores/
│       ├── report-store.ts
│       └── ui-store.ts
├── resources/                 # bundled defaults
│   ├── template.html
│   ├── config/
│   │   ├── report-schema.json
│   │   └── roles.json
│   └── reports/
│       └── 2026-07-23.json    # seed
├── scripts/
│   ├── migrate-legacy-html.ts # one-shot HTML → JSON
│   └── check-template-bindings.ts
└── docs/
    └── …                      # product docs
```

---

## Feature boundaries (SOLID)

| Feature | Ответственность | Не знает о |
|---------|-----------------|------------|
| `core/derive` | расчёт delta/progress | React, Tauri |
| `core/render` | HTML string | UI store |
| `features/editor` | формы | FS paths |
| `features/preview` | iframe sync | export formats |
| `features/export` | save dialogs | form internals |
| Tauri commands | FS/dialogs | business rules |

---

## Ключевые модули core

### `deriveReport(current, previous) → ViewModel`

Добавляет:

- `metrics[i].delta`, `.deltaLabel`, `.tone`, `.progress`
- `funnel.totals`, `funnel.stages[i].barWidth`, `.weeklyDelta`
- `team.dynamics.delta`, `.deltaPercent`, staff %
- `general.formattedDate`

### `createNextWeek(previous, reportDate) → WeeklyReport`

- копирует JSON
- `weekNumber++`, новая дата
- сдвигает `activities.weekDates` / cells
- обнуляет недельные комментарии (опционально, flag)
- `previousReportId = previous.meta.id`

### `renderHtml(template, viewModel) → string`

Handlebars helpers: `formatNumber`, `formatCurrency`, `progressWidth`, `eq`, `chartJson`.

---

## UI маршрутизация

Без URL-роутера достаточно mode state:

- `mode: 'editor' | 'wizard' | 'history'`
- `activeSection: 'general' | 'metrics' | …`
- `wizardStep: 1..9`

---

## Тесты (сразу с реализацией)

| Уровень | Что |
|---------|-----|
| Unit | derive, format, createNextWeek, zod |
| Unit | render smoke (snapshot ключевых чисел) |
| Component | metric field → store → preview message |
| E2E (later) | wizard → export file exists |

---

## Сборка macOS

```bash
npm run tauri build
# → .dmg / .app
```

Минимальная поддержка: Apple Silicon + Intel (universal later).

---

## Этап 5 — что согласовать перед кодом

См. `05-decisions.md`.
