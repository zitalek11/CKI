# Этап 2 — Модель данных

## Принципы

1. **Source of truth = JSON**, не HTML.
2. Храним только **исходные** поля; derived вычисляются в domain-слое.
3. Один отчёт = один файл `reports/YYYY-MM-DD.json` (дата пятницы / даты отчёта).
4. Конфиг продукта (продукты, цели года, схема KPI) — отдельно: `config/report-schema.json`.
5. Предыдущая неделя доступна для auto-delta через `meta.previousReportId`.

---

## Схема верхнего уровня

```ts
type WeeklyReport = {
  meta: ReportMeta;
  general: GeneralSection;
  products: ProductsSection;      // редко меняется
  goals: Goals2026;               // почти статично
  metrics: MetricCard[];          // еженедельно
  funnel: FunnelSection;          // еженедельно
  roadmap: RoadmapItem[];         // редко / квартально
  activities: ActivitiesSection;  // еженедельно
  team: TeamSection;              // редко
  charts: ChartSeries[];          // еженедельно (факт текущего месяца)
  ticker: TickerConfig;           // bindings, не сырые числа
};
```

---

## Детализация

### `meta`

```ts
{
  id: "2026-07-23",
  weekNumber: 30,
  reportDate: "2026-07-23",      // ISO
  createdAt: "...",
  updatedAt: "...",
  previousReportId: "2026-07-16",
  author: "…",
  status: "draft" | "ready" | "exported",
  schemaVersion: 1
}
```

### `general`

```ts
{
  title: "Еженедельный отчёт",
  subtitle: "Команда продукта ЦКИ",
  brandTag: "ЦКИ | НРД",
  pillars: [
    { title: "Golden Source", caption: "корп. данных", tone: "cyan" },
    { title: "ГК МБ", caption: "партнёр", tone: "purple" },
    { title: "Moex.com", caption: "данные B2C", tone: "amber" }
  ]
}
```

Дата на титуле **не дублируется** — берётся из `meta.reportDate` + форматтер `d MMMM yyyy` (ru).

### `goals`

```ts
{
  revenueYear: 60_000_000,       // 60M ₽/год (slide 7)
  revenueMonthly: 4_700_000,     // 4,7M ₽/мес (slide 3)
  clients: 53,
  subscriptions: 103,
  coverage: 90
}
```

### `metrics[]`

```ts
{
  id: "clientsExternal",
  label: "Клиенты (внешние)",
  category: "base" | "activity" | "retention" | "monetization",
  value: 17,
  unit: "шт",
  unitHint?: "без изм. текст единицы",
  goalKey?: "clients",            // ссылка на goals.*
  format: "number" | "currency" | "percent" | "thousands",
  compareWithPrevious: true,      // включать auto-delta
  accent: "cyan" | "purple" | "green" | "amber"
}
```

**Не храним:** delta, arrow, color, progress%, bar width.

### `funnel`

```ts
{
  stages: [
    {
      id: "needAssessment",
      label: "Оценка потребности",
      count: 61,
      amountThousands: 17940,
      highlight?: "amber" | "green"
    }
    // …
  ],
  comments: [
    { id: "c1", tone: "green" | "cyan" | "amber" | "purple", text: "…" }
  ]
}
```

**Derived:** `totalCount`, `totalAmount`, `weeklyDelta` per stage (vs previous), `barWidth` (нормализация к max count).

> Альтернатива лучше текущего HTML: `weeklyDelta` не хранить в JSON этапа — всегда считать из `previous.funnel.stages[i].count`. В образце «0» и «+1» — ручные; автомат уберёт ошибки.

### `roadmap[]`

```ts
{
  id: "q3-2026",
  period: "Q3 2026",
  status: "done" | "current" | "planned" | "future",
  description: "Календарь выплат…"
}
```

### `activities`

```ts
{
  weekDates: ["2026-07-20", "2026-07-27", "2026-08-03"], // ровно 3 колонки
  rows: [
    {
      role: "CLIENTS" | "FRONT" | "BACK" | "ADMIN",
      cells: ["текст\nстроки", "…", "…"]  // length === weekDates.length
    }
  ]
}
```

Операция «Новая неделя»:  
`weekDates = [...weekDates.slice(1), nextMonday]`,  
`cells = [...cells.slice(1), ""]`.

### `team`

```ts
{
  fteTotal: 18,
  fteStaff: 14,
  fteContract: 4,
  fteNrd: 14,
  fteMb: 4,
  dynamics: {
    before: { fte: 22.3, costThousands: 8469.1 },
    after:  { fte: 18,   costThousands: 6543.1 }
  },
  orgUnits: [
    {
      id: "data",
      title: "Обработка данных",
      fte: 5,
      members: ["Методолог", "…"],
      accent: "green"
    }
  ]
}
```

`delta`, `deltaPercent`, `% штатных` — derived.

### `charts[]`

```ts
{
  id: "revenue",
  title: "Накопленная выручка, млн ₽*",
  unit: "млн ₽",
  yMax: 60,
  color: "#5eead4",
  months: ["Янв","Фев",…,"Дек"],
  plan: [2.3, 4.5, …, 60],   // 12 чисел
  fact: [2.3, 4.5, 6.1, 7.8, 9.4, 11.04]  // нарастающий факт
}
```

Рендер: Chart.js / ECharts. SVG из исходника **не переносится**.

### `ticker`

```ts
{
  items: [
    { type: "static", text: "ЦКИ | Центр Корпоративной Информации" },
    { type: "binding", template: "Накопленная выручка {{metrics.revenueAccumulated|currency}} ₽/мес" },
    { type: "binding", template: "{{metrics.clientsExternal}} внешних клиентов" }
  ]
}
```

---

## Конфиг схемы полей (`config/report-schema.json`)

Позволяет добавлять KPI без изменения кода UI:

```json
{
  "sections": [
    {
      "id": "metrics",
      "title": "KPI",
      "roleAccess": ["sales", "admin"],
      "fields": [
        {
          "path": "metrics[id=clientsExternal].value",
          "label": "Клиенты (внешние)",
          "type": "number",
          "min": 0,
          "wizardStep": 2,
          "searchTags": ["клиенты", "KPI", "база"]
        }
      ]
    }
  ]
}
```

UI (форма, поиск, мастер, роли) строится из schema + Zod-валидаторов, генерируемых из той же схемы.

---

## Пример файла отчёта

См. `docs/cki-report-studio/examples/2026-07-23.json`.

---

## Валидация (Zod, domain)

| Правило | Условие |
|---------|---------|
| Обязательные | `meta.reportDate`, `meta.weekNumber`, все metric.value |
| Диапазон % | churn, coverage, multiService ∈ [0, 100] |
| Выручка | ≥ 0 |
| Воронка | counts ≥ 0, amounts ≥ 0; stages не пустые |
| Активности | 3 колонки дат; cells.length === 3 |
| Графики | plan.length === 12; fact.length ∈ 1..12; fact ≤ yMax (warning) |
| Progress | derived ≤ 100 (warning если value > goal) |

---

## Миграция с текущего HTML

Одноразовая операция (скрипт / мастер импорта):

1. Распарсить известные селекторы / regex по слайдам (bootstrap).
2. Заполнить JSON.
3. Сохранить как `reports/2026-07-23.json`.
4. Дальше HTML исходник не трогаем — только `template.html` с placeholders.
