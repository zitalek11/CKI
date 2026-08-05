# 11. Empty · Error · Microinteractions · Accessibility

## 11.1. Empty States

Каждый empty state = **объяснение + один primary CTA + optional secondary**.

| Экран | Message | Primary CTA |
|-------|---------|-------------|
| No Stories in Backlog | «Бэклог пуст — создайте первую User Story» | Create Story |
| No Initiatives in Quarter | «Зафиксируйте ставки квартала» | Create Initiative |
| No Releases | «Соберите первый релизный срез» | Create Release |
| No People/Employees | «Добавьте команду, чтобы считать Load» | Invite / Add people |
| No Templates | «Без шаблона Story не развернёт работы» | Create Workflow Template |
| Sprint empty commitment | «Перетащите Ready Story или нажмите Enter» | Open Ready backlog |
| Search no results | «Ничего не найдено — измените запрос» | Clear filters |
| Notifications empty | «Сигналов нет — хороший знак» | Open Today |
| Risks empty | «Открытых рисков нет» | Review Load |

Визуал: спокойная линейная иллюстрация / glyph, не клоунада.

---

## 11.2. Error States

Ошибки **человеческие**, с причиной и действием.

| Ситуация | UX |
|----------|-----|
| Hard dependency cycle | Toast/inline: «Нельзя создать зависимость — цикл A→B→A» + link nodes |
| Hard overload commit | Sheet: util 124% SA · list contributors · actions: Remove N points / Override |
| DoR incomplete | Checklist missing items highlighted; нельзя Ready |
| Freeze membership add | «Release в freeze — нужен override» + request reason |
| Network/sync fail | Banner non-blocking + Retry; optimistic rollback if needed |
| Permission denied | «Недостаточно прав — попросите PM/Manager» |
| Conflict rowVersion | «Объект изменён параллельно» · Reload · Compare |

Никаких `Error 500` без перевода.

---

## 11.3. Microinteractions (оживление без шума)

| Событие | Feedback |
|---------|----------|
| Create User Story | Peek opens; Work rows stagger-in; toast «6 работ · зависимости построены» |
| Drag commit to sprint | row ghost + load bars animate width |
| Status change | chip cross-fade; progress rail ticks |
| Unblock dependency | blocked icon dissolves; successor flash ready |
| Capacity recalculate | meters ease to new %; threshold color morph |
| Successful save inline | subtle check fade (no modal) |
| Mass replan confirm | confetti **запрещён**; solid toast + Undo |
| Copy key `CKI-142` | tiny «Copied» near cursor |

Motion supports hierarchy: attention on result of planning actions, not decoration.

---

## 11.4. Accessibility

### Contrast
- Text/icons WCAG AA minimum on Light & Dark
- Status never color-only: icon + label

### Targets
- Min hit area 24–28pt; list rows full-width clickable
- Spacing for dense mode still keyboard-friendly

### Keyboard
- Full nav without mouse (see hotkeys)
- Focus trap in dialogs/palette
- Skip to main content equivalent: `g` sequences

### Screen reader (foundation)
- Roles for listbox/table/dialog
- Live region for toasts and critical signals
- Peek announced as complementary dialog

### Color blindness
- Health: icon shapes (check / alert / cross) + text
- Charts: patterns/labels not only hue

### Reduce Motion
Respect system setting; disable stagger/slide.

---

## 11.5. Loading patterns

- First paint: skeleton of current page structure
- Peek: show header instantly, body skeleton
- Avoid full-window spinners
- Slow recalc (critical path): inline progress on meter («updating…») without blocking UI
