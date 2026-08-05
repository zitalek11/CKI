# CKI Report Studio

Desktop-приложение для подготовки еженедельного HTML-отчёта команды ЦКИ.

**Стек:** React 19 · TypeScript · Vite · Zustand · Zod · Handlebars · Chart.js · Tauri 2

## Установка на этот Mac

См. [INSTALL.md](./INSTALL.md).

Кратко:
- Приложение: `/Applications/CKI Report Studio.app`
- DMG: `~/Desktop/CKI Report Studio_0.1.0_aarch64.dmg`
- Данные: `~/Documents/CKI Report Studio/reports/`

## Быстрый старт (web / UI)

```bash
cd cki-report-studio
npm install
npm run dev
```

## Возможности MVP

- JSON-модель отчёта вместо ручного HTML
- Live Preview справа + click-to-edit
- Авто-расчёты ▲/▼, progress %, суммы воронки
- Мастер обновления недели
- История + «Новый отчёт»
- Импорт JSON / CSV, экспорт HTML (Chart.js)
- Undo / Redo, поиск, валидация
- Хранение в `~/Documents/CKI Report Studio/` (desktop)

## Сборка macOS (.dmg)

```bash
npm install
npm run build:dmg
```

Нужны: Node 22+, Rust (`rustup`), Xcode CLT.

## Данные в репозитории

- Seed: `resources/reports/2026-07-23.json`
- Шаблон: `resources/templates/template.html`
- Схема: `resources/config/report-schema.json`

## Тесты

```bash
npm test
npm run build
```

## Архитектура

См. `../docs/cki-report-studio/`.
