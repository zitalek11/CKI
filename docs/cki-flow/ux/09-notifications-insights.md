# 09. Notifications & Insights (Analytics)

## 9.1. Принцип уведомлений

**Ненавязчиво. Actionable. Редко.**

PM не должен получать push на каждый comment.  
Уведомления = только то, что меняет план или риск.

### Каналы

| Channel | Использование |
|---------|---------------|
| In-app bell | основной |
| Today signals | дублирует критичное (не шум) |
| OS notification | только critical (release freeze broken, hard overload on active sprint) — user preference |
| Email | opt-in digest |

### Типы (примеры)

| Тип | Severity | Действие |
|-----|----------|----------|
| Release risk high | high | Open Release |
| Team role overload | high | Open Load |
| Dependency blocked | medium | Open Story deps |
| Work overdue (forecast past sprint end) | medium | Reschedule |
| Date moved (release/sprint) | medium | View diff |
| Story assigned to you | low | Open |
| Buffer exhausted | high | Swap scope |

### UX bell panel

- Grouped by day
- Unread subtle dot (не красный счётчик 99+)
- Snooze 1h / tomorrow
- «Fix» button when suggestion exists
- Preferences: per-type mute

### Anti-noise rules

- Batch: «3 stories blocked» вместо 3 пингов
- No notify on own actions
- Quiet hours support

---

## 9.2. Analytics (Insights → Analytics)

**Цель:** состояние продукта за одну минуту.

### One-minute Pulse (верх экрана)

4 плитки (не 20):

1. Quarter Health + why
2. Sprint predictability (committed vs done trend)
3. Bottleneck role this/next sprint
4. Next Release readiness

### Графики (полезные PM)

| Chart | Зачем |
|-------|-------|
| Burn-up Quarter Goals / Stories | progress vs time |
| Velocity last 6 sprints | planning input |
| Role utilization heatmap (roles × sprints) | capacity truth |
| Blocker aging histogram | flow health |
| Release readiness history | delivery confidence |
| Interrupt vs planned work ratio | scope discipline |
| Template deviation rate | process quality |

### Drill-down

Клик по точке графика → список объектов (Stories/Work), не «мертвый chart».

### Чего не делаем

 vanity dashboards, 3D charts, радужные pie без действия.

---

## 9.3. Связь Analytics ↔ Today

Критические отклонения из Analytics порождают Today signals автоматически (через Domain events), без ручного мониторинга.
