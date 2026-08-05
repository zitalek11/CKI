# Этап 3 — Архитектура приложения

## Продуктовое имя

**CKI Report Studio** — desktop-приложение для подготовки еженедельного HTML-отчёта ЦКИ.

> Существующий репозиторий `cki` (витрина данных MOEX) — **другой продукт**. Report Studio должен жить как отдельный app (рекомендация: новый корень репозитория или `apps/report-studio` в monorepo). Смешивать с порталом данных не следует.

---

## Рекомендуемый стек (с корректировками к ТЗ)

| Слой | Выбор | Почему |
|------|-------|--------|
| Shell | **Tauri 2** | .dmg, без Node у пользователя, маленький бинарь |
| UI | React 19 + Vite + TypeScript | как в ТЗ |
| Components | Tailwind + **shadcn/ui** | формы, аккордеоны, dialogs |
| Forms | React Hook Form + Zod | валидация + типы |
| State | **Zustand** (+ temporal middleware для Undo/Redo) | проще RHF+preview sync, чем Redux |
| Template | **Handlebars** (или Liquid) | HTML export; familiar |
| Charts in export | **Chart.js** (CDN в template) | легче ECharts для 4 line charts |
| Preview charts | тот же Chart.js в iframe | паритет preview/export |
| Storage | файловая система через Tauri FS | `reports/*.json`, `template.html` |
| PDF/PNG | опционально: `html2canvas` / headless print later | не блокирует MVP |

---

## Ключевое архитектурное решение (лучше «умного анализа HTML»)

### ❌ Не делать primary-путь: эвристический парсинг «живого» HTML каждую неделю

Парсинг чисел/дат из произвольного HTML хрупок: смена вёрстки ломает карту полей, дубли трудно резолвить, SVG невосстановим.

### ✅ Делать: Schema-driven + Annotated Template

```
config/report-schema.json   →  описывает поля, секции, роли, wizard steps
templates/template.html     →  Handlebars + data-field="metrics.clientsExternal"
reports/*.json              →  данные недели
```

**Умный анализ** остаётся как:

1. **Одноразовый импорт** legacy HTML → JSON (bootstrap).
2. **Dev-утилита** «Scan template» — проверка, что все `{{…}}` / `data-field` есть в schema (и наоборот).

Это даёт конфигурируемость из ТЗ **без** иллюзии полного auto-discovery продакшен-HTML.

---

## Потоки данных

```
┌─────────────┐     load      ┌──────────────────┐
│ reports/*.json│ ──────────► │ Report Store     │
└─────────────┘               │ (Zustand)        │
                              │ + Undo/Redo      │
┌─────────────┐               │ + derived calc   │
│ report-schema │ ──────────► └────────┬─────────┘
└─────────────┘                        │
                                       ▼
                    ┌──────────────────────────────────┐
                    │  ViewModel = report + derived     │
                    └──────────────┬───────────────────┘
           ┌───────────────────────┼───────────────────────┐
           ▼                       ▼                       ▼
    Editor Form              Live Preview              Export
    (RHF / schema)           (iframe HTML)             HTML/PDF
           │                       │
           └──────── sync ─────────┘
              (patch path → store)
```

### Live Preview

1. Renderer собирает HTML string: `Handlebars.compile(template)(viewModel)`.
2. Для charts: в шаблоне `<canvas data-chart="revenue">` + inline script Chart.js с JSON из `viewModel.charts`.
3. HTML пишется в `iframe.srcdoc`.
4. Debounce ~50–100ms на ввод.

### Click-to-edit в Preview

1. В template каждое динамическое значение обёрнуто:
   ```html
   <span data-field="metrics.clientsExternal.value" data-editable="true">{{format …}}</span>
   ```
2. В iframe content script (или inline): click → `postMessage({ type: 'edit', path, value })`.
3. Host открывает popover/inline input → `store.patch(path, newValue)` → form + preview обновляются.

---

## Domain layer (чистая бизнес-логика)

```
packages/report-core/   (или src/core/)
  ├── schema/           Zod + types
  ├── derive/           deltas, progress, funnel totals, team %
  ├── format/           ru-RU currency, dates, arrows
  ├── validate/         export gates
  ├── week/             createNextWeek(previous)
  ├── import/           json/csv (+ excel later)
  └── render/           handlebars helpers + chart payload
```

UI и Tauri **не содержат** правил ▲/▼ — только вызывают `deriveReport(report, previous)`.

---

## Режимы UX

### 1. Editor (default)

```
┌──────────────┬─────────────────────────────┐
│ Nav/Search   │                             │
│ Sections     │     Live Preview (iframe)   │
│ Accordion    │                             │
│ Fields       │                             │
├──────────────┴─────────────────────────────┤
│ Validate status · Export HTML · PDF · PNG  │
└────────────────────────────────────────────┘
```

### 2. Weekly Update Wizard

Stepper (9 шагов из ТЗ). Каждый шаг = `wizardStep` из schema. В конце — diff vs previous + export.

### 3. History

Список `reports/` → open / duplicate / compare (diff JSON).

---

## Роли (закладка на будущее)

`config/roles.json`:

```json
{ "sales": ["funnel", "metrics.monetization"], "dev": ["roadmap", "activities.FRONT", "activities.BACK"], … }
```

MVP: все роли = admin. API доступа уже через schema `roleAccess`.

---

## Хранение на диске (Tauri)

```
~/Documents/CKI Report Studio/   (или app data dir)
  ├── template.html
  ├── config/
  │     ├── report-schema.json
  │     └── roles.json
  └── reports/
        ├── 2026-07-09.json
        ├── 2026-07-16.json
        └── 2026-07-23.json
```

При первом запуске — копирование defaults из ресурсов приложения.

---

## Экспорт

| Формат | MVP | Как |
|--------|-----|-----|
| HTML | ✅ | render → save dialog |
| PDF | later | `window.print` в hidden webview / `@sparticuz/chromium` не нужен на macOS — WKWebView print |
| PNG | later | html2canvas по активному слайду |
| JSON | ✅ | уже есть |
| CSV metrics | ✅ | import/export tables |

Экспортированный HTML — **self-contained** (CDN Chart.js + inline data), открывается в браузере без приложения.

---

## Альтернативы (рассмотрены)

| Вариант | Вердикт |
|---------|---------|
| Electron вместо Tauri | тяжелее; оставляем Tauri |
| React-компоненты вместо HTML template | ломает «тот же HTML что отправляем руководству»; template лучше |
| Только form, без click-to-edit | медленнее UX; делаем оба |
| Полный AI-парсинг HTML | нестабильно; только bootstrap |
| Хранить delta в JSON | источник рассинхрона; только derive |

---

## MVP scope (после согласования)

**P0**

- Модель + derive + Handlebars template из текущего отчёта
- Editor + Live Preview
- Create next week
- Export HTML
- History list
- Wizard
- Auto delta / progress
- Chart.js вместо SVG

**P1**

- Click-to-edit preview
- Undo/Redo
- Search fields
- JSON/CSV import
- Validation gate

**P2**

- Roles
- PDF/PNG
- Excel import
- Schema UI («добавить KPI»)
