# CKI Report Studio

Desktop-приложение для подготовки еженедельного HTML-отчёта команды ЦКИ.

**Стек:** React 19 · TypeScript · Vite · Zustand · Zod · Handlebars · Chart.js · Tauri 2 (macOS .dmg)

## Быстрый старт (web / UI)

```bash
cd cki-report-studio
npm install
npm run dev
```

Откройте http://localhost:5173/

## Возможности MVP

- JSON-модель отчёта вместо ручного HTML
- Live Preview справа
- Click-to-edit в preview
- Авто-расчёты ▲/▼, progress %, суммы воронки
- Мастер обновления недели
- История отчётов + «Новый отчёт» (копия прошлой недели)
- Импорт JSON / CSV метрик
- Экспорт HTML (self-contained + Chart.js)
- Undo / Redo
- Поиск по полям
- Валидация перед экспортом

## Сборка macOS (.dmg)

На машине с macOS + Xcode:

```bash
npm install
npm run tauri build
```

Требуется Rust toolchain. Конфиг: `src-tauri/`.

## Данные

- Seed: `resources/reports/2026-07-23.json`
- Шаблон: `resources/templates/template.html`
- Схема полей: `resources/config/report-schema.json`

В браузерном режиме отчёты хранятся в `localStorage`. В Tauri — планируется `~/Documents/CKI Report Studio/`.

## Тесты

```bash
npm test
npm run build
```

## Документация архитектуры

См. `../docs/cki-report-studio/`.
