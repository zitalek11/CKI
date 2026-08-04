# CKI — Roadmap развития витрины данных

Дорожная карта построена на базе:
- исходного product vision (AI Copilot, enterprise data portal);
- официальной документации [ЦКИ API MOEX](https://iss.moex.com/iss/apps/nsd_corp_info/v1/docs#);
- практик мировых платформ: **Bloomberg Terminal**, **S&P Capital IQ**, **FactSet**, **Refinitiv Eikon**, **TradingView**.

---

## Текущий статус (MVP Foundation) ✅

- React 19 + Vite + TypeScript + TanStack Router/Query
- Dark enterprise UI, sidebar navigation
- Dashboard с KPI, графиками, лентой событий
- AI Copilot (rule-based mock)
- Companies list + Company profile
- Analytics comparison (до 5 эмитентов)
- Corporate Actions (feed + calendar)
- API Explorer с production endpoints ЦКИ
- Mock data layer (8 эмитентов)

## Этап 1 — Production Data Layer 🚧 (в работе)

**Уже сделано:**
- `VITE_API_MODE=auto|live|mock` — режимы данных
- Dev proxy `/moex-api` и `/moex-iss` → MOEX ISS (SSL + optional MOEX Passport)
- Live fetch: companies list, company profile, corp actions
- Live MSFO-short: KPI history, revenue/EBITDA charts, reports list
- Auto fallback на mock при ошибках
- API Explorer Try request через proxy
- Data source badge (MOEX Live / Mock), debounced search, error UI

**Осталось:**
- MOEX Passport credentials в `.env` для закрытых endpoints (МСФО, рейтинги)
- Production backend proxy (для deploy без Vite dev server)
- Pagination adapter для всех list endpoints
- KPI / financials mapping из `/accounting/msfo-full/...`

---

## Этап 2 — Universal Search & Navigation (2 недели)

**Цель:** единый поиск как у Bloomberg `<GO>` / CapIQ search bar.

| Фича | API | Референс |
|------|-----|----------|
| Global search (ticker, ISIN, INN, OGRN, name) | `/info/companies?q=`, `/info-nsd/securities?isin=` | Bloomberg SRCH |
| Autocomplete + recent searches | local storage + API | FactSet search |
| Command palette (⌘K) | — | Linear, Vercel |
| Pinned / favorites companies | — | TradingView watchlist |
| Keyboard shortcuts | — | Bloomberg Terminal |

---

## Этап 3 — Financial Analytics Depth (3–4 недели)

**Цель:** уровень CapIQ/FactSet для сравнительного анализа.

| Фича | API | Референс |
|------|-----|----------|
| Compare up to 5 issuers (full) | `/accounting/msfo-full/companies/{id}/indicators` | CapIQ Comps |
| Ratio engine (ROE, ROA, Debt/EBITDA, margins) | indicators + derived | FactSet ratios |
| Industry benchmarks overlay | `/accounting/msfo-full/industry-indicators/reports` | S&P Capital IQ |
| Interactive charts (zoom, brush, export PNG/CSV) | — | TradingView |
| Radar / heatmap comparison | — | FactSet portfolio analytics |
| Excel export | — | CapIQ Excel Plug-In |

---

## Этап 4 — Corporate Actions & Market Calendar (2–3 недели)

**Цель:** полноценный event intelligence как у Bloomberg corporate actions.

| Фича | API | Референс |
|------|-----|----------|
| Dividends module | `/corp-actions/dividends` | Bloomberg DVD |
| Coupons module | `/corp-actions/coupons` | fixed income desks |
| Shareholder meetings | `/corp-actions/meetings` | IR calendar |
| Unified timeline | `/corp-actions`, `/calendars/ir-calendar` | FactSet events |
| Calendar view (month/week/list) | `/calendars/ir-calendar` | Refinitiv calendar |
| Event subscriptions / alerts | — | Bloomberg alerts |

---

## Этап 5 — Ratings & Credit Intelligence (2 недели)

| Фича | API | Референс |
|------|-----|----------|
| Current ratings dashboard | `/rating/companies`, `/rating/securities` | Bloomberg RATING |
| Rating history & changes | `/rating/history/companies/{id}` | CapIQ credit |
| Aggregated ratings view | `/rating/agg/companies` | composite scores |
| Rating alert center | — | Bloomberg ALRT |
| Credit timeline on company page | — | S&P CIQ |

---

## Этап 6 — Reports & Disclosure Viewer (3 недели)

| Фича | API | Референс |
|------|-----|----------|
| IFRS / RAS report browser | `/accounting/msfo-full/...`, `/accounting/rsbu/...` | CapIQ financials viewer |
| Corp info reports | `/reporting/corp-info/reports` | disclosure portal |
| Affiliates reporting | `/reporting/affiliates/reports` | related parties |
| Interactive report viewer | report values endpoints | SEC EDGAR viewer |
| Compare reports YoY / QoQ | — | FactSet financials |
| Download PDF / export tables | — | enterprise compliance |

---

## Этап 7 — AI Copilot 2.0 (3–4 недели)

**Цель:** Natural Language → Dashboard (ключевая дифференциация продукта).

| Фича | Описание | Референс |
|------|----------|----------|
| Intent parser (RU/EN) | «Сравни Сбер и ВТБ» → compare view | Bloomberg ASKB |
| Auto dashboard generation | charts + tables + KPI cards | FactSet AI |
| Saved analytical views | persist user queries | CapIQ screens |
| Insight engine | auto summaries per company | Bloomberg Intelligence |
| Source links to disclosures | traceability to CCI data | audit-ready SaaS |
| Executive mode vs Analyst mode | simplified vs detailed UI | Bloomberg vs CapIQ |

---

## Этап 8 — Watchlists & Portfolio Mode (2 недели)

| Фича | Описание | Референс |
|------|----------|----------|
| Custom watchlists (Banks, Oil, Portfolio) | user-created lists | TradingView |
| Portfolio upload (ISIN/tickers) | CSV import | FactSet portfolios |
| Aggregated portfolio analytics | sector, ratings, events | wealth dashboards |
| Push/email notifications | dividend, rating, report | Bloomberg alerts |

---

## Этап 9 — Enterprise UX & Platform (ongoing)

| Фича | Референс |
|------|----------|
| Skeleton loaders + optimistic UI | Stripe Dashboard |
| Resizable panels / saved layouts | Bloomberg Launchpad |
| Role-based access (executive / analyst) | enterprise SaaS |
| Audit log & data lineage | compliance |
| Multi-language (RU/EN) | MOEX international users |
| Mobile-responsive executive view | Bloomberg mobile app |
| shadcn/ui component system | design consistency |
| TanStack Table (sort, filter, pin, export) | analyst workflows |

---

## Этап 10 — Stretch Goals (дифференциаторы)

| Фича | Описание |
|------|----------|
| **Relationship Graph** | связи эмитент ↔ выпуск ↔ рейтинг ↔ КД |
| **Timeline Intelligence** | единая шкала: отчётность + КД + рейтинги + news |
| **Alert Center** | подписки на изменения рейтингов, отчётность, дивиденды |
| **Portfolio Mode** | загрузка портфеля → агрегированная аналитика |
| **Executive Mode** | KPI-only view для руководителей |
| **Analyst Mode** | детальные таблицы, фильтры, bulk export |
| **API sandbox** | Try request с реальной авторизацией в Explorer |
| **White-label demo stand** | презентация для руководства НРД / MOEX |

---

## Приоритет для ближайшего спринта

1. **Подключение MOEX Passport + live API** (Этап 1)
2. **Universal Search** (Этап 2)
3. **Ratings module** (Этап 5) — высокая ценность для банков и УК
4. **Market Calendar** (Этап 4) — сильный demo-сценарий для руководства

---

## Метрики успеха demo-продукта

- Время ответа на вопрос «Что происходит на рынке?» < 3 сек
- Поиск эмитента по ISIN/названию < 1 сек
- Сравнение 5 компаний без перезагрузки страницы
- 100% экранов работают без mock (fallback только offline)
- Demo-ready UI уровня «показать CEO банка»
