# Этап 5 — Решения к согласованию

**Статус: подтверждено пользователем (2026-08-05). Этап 6 в работе.**

## Принятые решения

| # | Тема | Решение |
|---|------|---------|
| A | Расположение | `cki-report-studio/` в репозитории (отдельно от portal) |
| B | Шаблон | Handlebars + schema; не live-парсинг HTML |
| C | Графики | Chart.js |
| D | Хранение | Tauri: `~/Documents/CKI Report Studio/`; web-MVP: localStorage |
| E | Scope MVP | Editor, Preview, Wizard, Export HTML, derive, history, Undo/Redo, search, validation, click-to-edit |
| F | Seed date | `2026-07-23` |

Подробности исходных альтернатив — в git history этого файла / PR анализа.
