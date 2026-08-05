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
| **7** | Dependency Engine (cycle + ready/blocked) | **done (core)** |
| **8** | Planning Engine | next |
| **9** | Capacity Engine | **done (demand)** / supply next |
| **10** | Основные экраны по UX | partial (Today/Backlog/Templates/Load) |
| **11** | Analytics | pending |
| **12** | Import / Export | pending |
| **13** | UI polish | pending |
| **14** | macOS `.dmg` сборка | pending |

## Архитектура слоёв (после этапа 2–3)

```
Presentation (React / FSD pages-widgets-features)
    ↓
Application (services, ports)
    ↓
Domain (entities, rules, engines — pure)
    ↓
Infrastructure (storage adapters, seed, unit of work)
```

StoragePort позволяет заменить LocalStorage → Tauri FS / HTTP без переписывания сервисов.

## Правила

1. Не переходить к следующему этапу, пока текущий не собран и проверен.
2. Бизнес-логика — вне React (`src/domain`, `src/application`).
3. Zustand — модульные store (`theme`, `shell`, `workspace`).
4. После этапа: `npm run build` + `npm test`.
5. Следующий фокус: Planning Engine (forecast dates) + Sprint commit UI + supply-side Capacity.

## Definition of Done (этапы 2–7)

- [x] Domain types/enums/errors
- [x] Workflow apply + hybrid policy
- [x] Dependency cycle checks + ready/blocked helpers
- [x] Capacity demand aggregation
- [x] LocalStorage + Memory storage ports
- [x] UnitOfWork + Story/Catalog/Bootstrap services
- [x] Demo seed (product, quarter, sprint, templates, team)
- [x] UI: create Story → auto WorkItems; Backlog; Templates; Load
- [x] Unit tests for engines + StoryService
