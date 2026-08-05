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

## Рабочие экраны

Today · Quarter · Sprint · Backlog · Board · Roadmap · Releases · Load · Risks · Analytics · Templates · Migration · Settings

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

## Следующие улучшения (после MVP)

- DnD на Board (`@dnd-kit`)
- Story Peek drawer
- Critical path visualization (React Flow)
- Tauri FS persistence вместо LocalStorage
- Apple Developer ID signing + notarization для публичной раздачи
