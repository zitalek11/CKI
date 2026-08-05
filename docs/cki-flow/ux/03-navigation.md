# 03. Навигация

## 3.1. Каркас окна (macOS desktop)

```
+------------------------------------------------------------------+
| ● ● ●   Product v   Quarter v   Team v      Search   cmdK   Bell |
+----------+-------------------------------------------------------+
| Sidebar  | Page header (title · view switch · primary actions)   |
|          +-------------------------------------------------------+
| Today    |                                                       |
| Plan     |                   Main canvas                         |
|  Quarter |                                                       |
|  Sprint  |                                                       |
| Deliver  |                                                       |
|  Backlog |                                                       |
|  Board   |                                                       |
|  Roadmap |                                                       |
|  Releases|                                                       |
| Insights |                                                       |
|  Load    |                                                       |
|  Risks   |                                                       |
|  Analytics                                                     |
| -------- |                                                       |
| Favorites|                                                       |
| Recents  |                                                       |
| -------- |                                                       |
| System   |                                                       |
+----------+-------------------------------------------------------+
                              Peek drawer (optional, right) -->
```

Sidebar: узкий по умолчанию (icon+label), collapsible to icons (`⌘\`).

---

## 3.2. Боковая панель

**Группы:** Today · Plan · Deliver · Insights · (divider) · Favorites · Recents · System.

Правила:

- не более **9** первичных пунктов без раскрытия System;
- badge только на Today (число actionable signals) и Notifications;
- Favorites — pin любых Saved Views / объектов;
- Recents — последние 10 объектов (Story, Epic, Release…).

---

## 3.3. Верхняя панель

| Элемент | Поведение |
|---------|-----------|
| Scope switchers | Product / Quarter / Team |
| Global Search | ⌘P или click — Spotlight-like |
| Command Palette | ⌘K |
| Notifications | bell with quiet badge |
| Profile / theme | light/dark/system |

Нет перегруженного toolbar из 15 кнопок.

---

## 3.4. Хлебные крошки

На object pages:

`Quarter › Initiative › Epic › CKI-142`

Клик по сегменту — переход.  
Для Peek — компактная строка контекста вместо полных breadcrumbs.

---

## 3.5. Глобальный поиск (Spotlight)

Открытие: `⌘P` / `⌘O`  
Поиск по: key, title, people, release version, initiative name.

Результаты группами: Stories · Epics · Initiatives · Releases · People · Views.  
Enter — открыть Peek; `⌘Enter` — Full page.

---

## 3.6. Быстрые действия

1. **⌘K** — любые команды.
2. **⌘N** — Quick Create (контекстный тип: в Backlog → Story, в Quarter → Initiative).
3. **Row actions** — `…` / right-click / hotkeys `S` status, `A` assign, `R` release…
4. **Bulk bar** — появляется при multi-select.

---

## 3.7. Избранное и недавние

- Star на объекте/view → Favorites в sidebar.
- Recents обновляются при открытии Peek/Full.
- Оба доступны из ⌘K (`Favorite: …`, `Recent: …`).

---

## 3.8. Навигационная память

- Запоминать last view mode (Board columns, Roadmap zoom, Backlog filters) per section.
- Object back-stack: `⌘[` / `⌘]` как в браузере/Figma.
- Deep links на key/object для шаринга в Slack.
