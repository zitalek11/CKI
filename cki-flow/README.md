# CKI Flow

Desktop-приложение для управления продуктовой разработкой команды ЦКИ.

Стек: **Tauri 2 · React 19 · TypeScript · Vite · Tailwind CSS 4 · Zustand · React Router**.  
Архитектура фронтенда: **Feature-Sliced Design (FSD)**.

Документы продукта:

- **[Руководство пользователя](./USER_GUIDE.md)** — как пользоваться приложением после установки
- [Архитектура](../docs/cki-flow/README.md)
- [Domain Model](../docs/cki-flow/domain/README.md)
- [UX Design](../docs/cki-flow/ux/README.md)
- [План разработки](./DEVELOPMENT.md)

---

## Статус разработки

Этапы **1–13** MVP — см. [DEVELOPMENT.md](./DEVELOPMENT.md).  
Этап 14 (`.dmg`) — на macOS: `npm run build:dmg`.

Уже можно:

- создать User Story → авто WorkItems + deps + forecast;
- Sprint commit, Board status transitions, Release readiness;
- Quarter / Roadmap / Load / Risks / Analytics;
- Command Palette (`⌘K`), Import/Export JSON;
- локальное хранение (LocalStorage) через StoragePort.

---


## Quick start (web)

```bash
cd cki-flow
npm install
npm run dev
```

Dev server: http://localhost:1420/

```bash
npm run build
npm test
```

## Desktop (macOS)

Требуются Rust + Xcode CLT на машине сборки macOS:

```bash
npm run dev:tauri
npm run build:dmg
```

> В Linux CI/cloud можно разрабатывать и проверять web-сборку. Нативный `.dmg` собирается на macOS (этап 14).

---

## Структура `src/` (FSD)

```
src/
  app/           # providers, layout, styles, router entry
  pages/         # route screens
  widgets/       # sidebar, topbar
  features/      # theme, shell (позже — create-story, planning…)
  entities/      # domain entities UI/model bindings (этап 2+)
  shared/        # ui kit, config, lib, api adapters
```

Бизнес-логика не живёт в React-компонентах — только presentation. Domain/services появятся на этапах 2–9.
