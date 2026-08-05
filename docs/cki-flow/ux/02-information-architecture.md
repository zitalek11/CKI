# 02. Информационная архитектура

## 2.1. Почему не плоский список разделов

Исходный список (Dashboard, Backlog, Roadmap, Quarter Planning, Sprint Planning, Releases, Capacity, Timeline, Calendar, Analytics…) корректен по покрытию, но **плох как навигация**: слишком много равноправных «домов», PM теряет контекст.

### Решение: 5 зон + объектный слой

```
TODAY          — сигналы и действия «сейчас»
PLAN           — Quarter · Sprint (режимы одного контура планирования)
DELIVER        — Backlog · Board · Roadmap/Timeline · Releases
INSIGHTS       — Load (Capacity) · Analytics · Risks
SYSTEM         — Templates · Team · Settings
+ OBJECT LAYER — Peek / Full page для любого Domain object
+ GLOBAL       — Search · Command Palette · Notifications
```

**Преимущества:**

- меньше пунктов в sidebar → быстрее ориентация;
- Timeline не отдельный «продукт», а режим Roadmap;
- Capacity назван **Load** в UI (понятнее PM), в модели остаётся Capacity;
- Calendar не отдельный раздел — встроен в Load/Absences и Milestone markers;
- Dashboard заменён на **Today** (actionable), а не «виджетная стена».

---

## 2.2. Полная карта приложения

### A. Today (Home)
Inbox сигналов + «Continue where you left off» + one-click actions.

### B. Plan
| Подраздел | Назначение |
|-----------|------------|
| **Quarter** | Goals, Initiatives, envelope, health, replan |
| **Sprint** | Commitment, load by role, board jump, risks |

Переключатель Quarter ↔ Sprint в одном разделе Plan (segmented control).

### C. Deliver
| Подраздел | Назначение |
|-----------|------------|
| **Backlog** | приоритезация, DoR, bulk |
| **Board** | Kanban (sprint или status stream) |
| **Roadmap** | L0–L2 + режим Timeline |
| **Releases** | состав, readiness, freeze |

### D. Insights
| Подраздел | Назначение |
|-----------|------------|
| **Load** | capacity by role/people |
| **Risks** | реестр + aging blockers |
| **Analytics** | velocity, burn, trends (1-minute product pulse) |

### E. System
Templates (Workflow), Team & People, Calendars, Status models, Preferences, Users/Roles.

### F. Object Layer (везде)
- **Peek** (right drawer, 420–480px) — 80% работы
- **Full page** — глубокая работа со Story/Initiative
- **Quick Create** — compact modal / command create

---

## 2.3. Иерархия zoom (как в Figma)

| Zoom | Объекты | Где |
|------|---------|-----|
| Portfolio | Goals, Initiatives | Plan → Quarter, Roadmap L0 |
| Delivery | Epics, Releases | Roadmap L1, Initiative page |
| Execution | Stories | Backlog, Sprint, Board |
| Work | Work Items | Story page, Board (work mode) |

Навигация zoom: click bar на Roadmap / breadcrumb / `⌘[` `⌘]` back-forward object history.

---

## 2.4. Продуктовые контексты (scope switcher)

В top bar: **Product** (если их несколько) · **Team** (filter) · **Quarter** (active context).

Большинство списков наследуют этот scope — меньше фильтров вручную.

---

## 2.5. Saved Views (личные и командные)

Любой список/board/roadmap может быть сохранён:

- «My interrupt stories»
- «SA bottleneck this sprint»
- «Release 2.4 must»

Saved Views живут под разделом или в Favorites — не плодят новые корневые пункты меню.
