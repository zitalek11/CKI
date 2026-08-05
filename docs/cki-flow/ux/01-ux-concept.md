# 01. UX-концепция

## 1.1. Продуктовая метафора

**Не «система учёта задач».**  
**А «операционная панель Product Manager».**

Аналогии ощущения:

| Референс | Что берём |
|----------|-----------|
| **Linear** | Скорость, плотность без грязи, object-centric, keyboard-first |
| **Raycast** | Command Palette как главный суперсила-интерфейс |
| **Notion** | Прогрессивное раскрытие, спокойная типографика, «воздух» |
| **Figma** | Многослойность view (zoom levels), мгновенный контекст объекта |
| **Apple HIG** | macOS native chrome, предсказуемые паттерны, свет/тьма, accessibility |

Чего избегаем: Jira-перегруз, CRM-формы на весь экран, дашборды из 30 виджетов, «корпоративный серый шум».

---

## 1.2. UX-принципы CKI Flow

### U1. Speed over ceremony
Любое частое действие — ≤ 3 шага, лучше 1 (hotkey / palette / drag).

### U2. Signals before tables
Сначала «что требует решения», потом полный список объектов.

### U3. Progressive disclosure
На поверхности — статус, риск, owner, next action.  
Детали — в Peek (боковая панель) или Full Object Page.

### U4. One object, many views
User Story выглядит одинаково из Backlog, Sprint, Roadmap, Release.  
Меняется только контекстная рамка, не модель карточки.

### U5. Views are projections
Kanban / Timeline / Roadmap **не редактируют «сами себя»** — они меняют Domain objects (status, assignment, membership).

### U6. Keyboard is a first-class UI
Мышь удобна; клавиатура обязательна для power mode 8 часов в день.

### U7. Calm density
Максимум информации при минимуме хрома. Два режима плотности: **Comfort** и **Compact** (default для списков у PM).

### U8. Delight through feedback, not decoration
Микроанимации подтверждают результат (создали Story → появились Work Items), не развлекают.

### U9. Prevent, then explain
Система предупреждает о overload / broken deps **до** подтверждения; ошибки — с действием «как исправить».

### U10. Opinionated defaults, flexible escape
Шаблоны, auto-deps, suggested assignees — по умолчанию. Override всегда доступен, но видим.

---

## 1.3. Персона и контекст использования

**Primary:** Product Manager ЦКИ  
**Secondary:** Manager, BA/SA (через те же object pages, другие default home)

Рабочий день PM:

1. Утро: сигналы риска / блокеры / capacity.
2. Planning blocks: sprint / quarter replan.
3. Intake: новые Story из идей/бэклога.
4. Sync: зависимости, релизы.
5. Close: демо, status, communication.

UX оптимизирован под **циклы решения**, не под заполнение полей.

---

## 1.4. Качество ощущений (UX quality bar)

| Ощущение | Как добиваемся |
|----------|----------------|
| Быстро | ⌘K, inline create, optimistic UI feedback, prefetch соседних объектов |
| Легко | мало обязательных полей; шаблоны; smart defaults |
| Современно | macOS materials, спокойная палитра, SF-like iconography |
| Под контролем | health chips, diff before mass replan, undo для ключевых действий |
| Приятно | мгновенный toast «12 задач создано из шаблона API», плавный peek |

---

## 1.5. Анти-паттерны (запрещены в UX)

1. Мастер из 7 шагов для создания Story.
2. Модалка на весь экран для смены спринта.
3. Разные карточки Story в разных разделах.
4. Ручное рисование Timeline «для красоты».
5. Badge-спам и радужные статусы без семантики.
6. Скрытые обязательные поля после Submit.
7. Навигация из 20 равноправных пунктов без группировки.
