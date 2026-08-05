# CKI Report Studio — анализ и архитектура (Этапы 1–5)

Документы подготовлены **до начала реализации** по требованию ТЗ.

| Этап | Документ | Статус |
|------|----------|--------|
| 1. Анализ HTML | [01-html-analysis.md](./01-html-analysis.md) | ✅ |
| 2. Модель данных | [02-data-model.md](./02-data-model.md) | ✅ |
| 3. Архитектура | [03-architecture.md](./03-architecture.md) | ✅ |
| 4. Структура проекта | [04-project-structure.md](./04-project-structure.md) | ✅ |
| 5. Согласование | [05-decisions.md](./05-decisions.md) | ⏳ ждём OK |
| 6. Реализация | — | 🔒 после согласования |

**Исходный HTML:** `templates/cki-weekly-report-source-2026-07-23.html`  
**Seed JSON:** [examples/2026-07-23.json](./examples/2026-07-23.json)

## Краткий вердикт

Отчёт — 7-слайдовый HTML-deck с ~90 точками ручной правки. Около 40% из них вычисляемые (▲/▼, %, progress, суммы), ещё ~25% дублируются (KPI в ticker/графиках/карточках).

**Продукт:** Tauri + React desktop «CKI Report Studio» — JSON → Editor/Wizard → Renderer → HTML export.

**Главная архитектурная поправка к ТЗ:** не строить продукт на еженедельном эвристическом парсинге HTML. Вместо этого — schema-driven модель + annotated Handlebars template; «умный анализ» только для разовой миграции и проверки bindings.
