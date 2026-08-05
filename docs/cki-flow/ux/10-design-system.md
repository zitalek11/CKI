# 10. Design System

Дизайн-система для **macOS desktop productivity app**: спокойная, плотная, читаемая.  
Не маркетинговый лендинг. Не «AI purple SaaS».

---

## 10.1. Визуальная концепция

- **macOS-native calm:** светлые нейтрали, аккуратные materials, системная логика окон.
- **Air + density balance:** больше воздуха в object pages; выше плотность в списках.
- **One accent:** сине-лазурный action color (не фиолетовый, не неоновый).
- **Semantic colors only for meaning:** risk/health/status — никогда для декора.
- **Typography-first hierarchy:** размер и вес важнее рамок и теней.
- **Minimum chrome:** меньше карточек-обёрток; разделители и spacing вместо box-in-box.

---

## 10.2. Цвета (логические токены)

### Light

| Token | Роль | Направление |
|-------|------|-------------|
| `bg.app` | окно | нейтральный светло-серый / off-white |
| `bg.surface` | панели | белый |
| `bg.subtle` | sidebar / rails | серый 2–4% |
| `bg.elevated` | popover/peek | белый + soft shadow |
| `border.subtle` | разделители | серый низкого контраста |
| `text.primary` | основной | near-black |
| `text.secondary` | мета | серый |
| `text.tertiary` | hints | |
| `accent.default` | CTA/links | blue-azure |
| `accent.muted` | selection bg | accent @ 12% |
| `danger` | errors/destructive | red |
| `warning` | risk/at_risk | amber |
| `success` | done/on_track | green |
| `info` | neutral info | blue-gray |

### Dark

| Token | Роль |
|-------|------|
| `bg.app` | deep neutral (не чистый #000) |
| `bg.surface` | elevated charcoal |
| `bg.subtle` | sidebar darker |
| `text.primary` | off-white |
| `accent` | slightly brighter azure for contrast |
| semantic colors | desaturated enough to avoid neon fatigue |

Theme: Light / Dark / System. Toggle `⌘⇧L`.

---

## 10.3. Типографика

Стек (логический): **SF Pro** как primary (macOS), fallback Inter only if needed — но целевой native feel = SF.

| Style | Size | Weight | Use |
|-------|------|--------|-----|
| Display | 22–24 | Semibold | редко, empty states |
| Title | 18 | Semibold | page titles |
| Headline | 15–16 | Semibold | peek titles, section |
| Body | 13 | Regular | default app text |
| Body Emphasis | 13 | Medium | |
| Meta | 12 | Regular | timestamps, keys |
| Mono | 12 | Regular | issue keys `CKI-142` |

Line-height комфортный; в Compact lists — tighter.

---

## 10.4. Иконки

- SF Symbols style / thin-regular stroke
- Размер UI icons 14–16pt в списках, 18–20 в nav
- Type icons для Work stages стабильны (BA/SA/BE/FE/QA)
- Не использовать emoji как UI

---

## 10.5. Spacing & radius

| Token | Value guide |
|-------|-------------|
| space.1–6 | 4 / 8 / 12 / 16 / 24 / 32 |
| radius.sm | 6 — chips, inputs |
| radius.md | 10 — popovers, peek |
| radius.lg | 14 — dialogs |
| Не использовать stadium pills повсюду | chips слегка скруглены, не «candy» |

---

## 10.6. Elevation & shadows

- Sidebar/peek: soft ambient shadow, один уровень
- Modals: medium
- **Запрет:** многослойные неон-glow тени
- Borders предпочтительнее теней внутри списков

---

## 10.7. Компоненты (логические)

### Buttons
Primary / Secondary / Ghost / Destructive. Height 28–32 compact.

### Inputs
Height 28–32; clear focus ring accent; inline edit looks like text until hover.

### Chips
Status, priority, release — low saturation fills.

### Tables
Primary workhorse. Sticky header, row hover, selected state, compact mode.

### Bars / Meters
Capacity & progress — thin, labeled, color only at thresholds.

### Peek
Right drawer, dismissible Esc, persistent while navigating lists.

### Toasts
Bottom-center or top; short; action Undo when applicable.

### Dialogs
Только для confirm destructive / replan preview — не для каждого edit.

### Cards
**Default: no cards** в списках. Cards допустимы для signal items и Goal strip, где единица = объект решения.

---

## 10.8. Состояния элементов

| State | Поведение |
|-------|-----------|
| Hover | soft bg / underline for links |
| Focus | visible ring 2px accent (keyboard) |
| Active/Pressed | slightly darker |
| Selected | accent.muted bg |
| Disabled | 40–50% opacity, no interaction |
| Loading | skeleton shapes (не спиннер на весь экран) |
| Empty | illustration-lite + CTA (см. 11) |
| Error | inline message + how to fix |

---

## 10.9. Анимации (motion principles)

| Token | Duration | Use |
|-------|----------|-----|
| instant | 0–80ms | hover |
| fast | 120–160ms | peek open, toggles |
| medium | 180–240ms | modal, section expand |
| stagger | 30–50ms | work items appear after template |

Easing: standard macOS ease-out.  
**Reduce Motion** — отключает stagger/slide, leaves fades/cut.

---

## 10.10. Плотность

| Mode | Где |
|------|-----|
| Compact | Backlog, Board, Load tables (default PM) |
| Comfort | Story full page reading, settings |

User preference in System → Preferences.

---

## 10.11. Responsive / windowing

Не mobile-app, но:

- Sidebar collapse < 1100px width
- Peek становится overlay на узких окнах
- Two-pane Sprint складывается в tabs
- Min supported width ~1024; optimal 1440+
- All primary flows usable at 1280×800

---

## 10.12. Визуальный стиль — summary

Современно = **тихо**.  
Много воздуха на object pages, много сигнала на Today, много скорости в списках.  
Никакого визуального крика.
