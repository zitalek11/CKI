# CKI Flow — план итеративной разработки

Разработка идёт **строго по этапам**. Каждый этап должен быть рабочим и проверяемым.

## Порядок этапов

| Этап | Цель | Статус |
|------|------|--------|
| **1** | Каркас приложения (Tauri/React/FSD/Shell/Theme) | **done** |
| **2** | Domain Layer (типы, инварианты, чистые функции) | next |
| **3** | Storage + Repository (локальное хранение, порт на сервер позже) | pending |
| **4** | Основные сущности CRUD (Product…Story…WorkItem) | pending |
| **5** | Автогенерация WorkItems из User Story | pending |
| **6** | Workflow Engine (templates/versions) | pending |
| **7** | Dependency Engine | pending |
| **8** | Planning Engine | pending |
| **9** | Capacity Engine | pending |
| **10** | Основные экраны по UX | pending |
| **11** | Analytics | pending |
| **12** | Import / Export | pending |
| **13** | UI polish | pending |
| **14** | macOS `.dmg` сборка | pending |

## Правила

1. Не переходить к следующему этапу, пока текущий не собран и проверен.
2. Бизнес-логика — вне React.
3. Zustand — модульные store, не монолит.
4. После этапа: lint/typecheck/tests + краткое резюме.
5. Предпочтительный формат следующих задач: одна подсистема/экран за раз
   (`реализуй Workflow Engine`, `экран Sprint Planning`, …).

## Предлагаемые библиотеки (отклонения от ТЗ — с причиной)

| Область | Выбор | Почему |
|---------|-------|--------|
| Router | `react-router-dom` + **HashRouter** | совместимость с Tauri `asset://` |
| DnD (позже) | **dnd-kit** | лучше a11y и tree support, чем React DnD |
| Charts (позже) | **Apache ECharts** | богаче для pulse/heatmap, как в ТЗ |
| Tables (позже) | TanStack Table | без лишнего UI opinion |
| Forms (позже) | RHF + Zod | как в ТЗ |
| Local DB (этап 3 option) | рассмотреть **Dexie (IndexedDB)** vs JSON file via Tauri FS | Dexie удобнее для запросов; FS проще для export — решение на этапе 3 |

## Definition of Done этапа 1

- [x] Проект `cki-flow/` создан
- [x] FSD структура и App Shell по UX
- [x] Тема light/dark/system
- [x] Роуты всех разделов
- [x] Error boundary + logger
- [x] `npm run build` и `npm test` проходят
- [x] Tauri конфиг для будущей `.dmg` сборки
