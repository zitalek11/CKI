# 08. Search · Command Palette · Hotkeys

## 8.1. Global Search (Spotlight)

**Open:** `⌘P` или `⌘O`  
**Цель:** найти любой объект < 3 секунд.

### UX

- Full-width sparse modal (Raycast/Spotlight feel)
- Fuzzy match on key + title + person + version
- Grouped results with icons
- Preview pane optional (right third) for Story health/status
- Enter → Peek; `⌘Enter` → Full page; `⌥Enter` → new window (future)

### Queries examples

`CKI-12`, `release 2.4`, `@ivan`, `SA blocked`, `view: sprint planning`

Filters via tokens: `type:story status:ready`.

---

## 8.2. Command Palette (Raycast-style)

**Open:** `⌘K`  
Универсальный action launcher + navigation.

### Категории команд

| Category | Examples |
|----------|----------|
| Create | Create User Story, Epic, Initiative, Release, Goal |
| Go to | Go to Sprint, Quarter, Roadmap, Load, Release… |
| Plan | Commit to Sprint, Move to Sprint, Replan Sprint, Add to Release |
| Object | Set Status, Assign, Set Priority, Apply Template |
| Find | Find Employee, Find View |
| System | Toggle Theme, Open Templates, Open Shortcuts |

### Поведение

- Natural language light matching (`replan sprint`, `new story api`)
- Contextual first: если открыт Story — команды Story выше
- Subcommands: `Move to Sprint →` выбирает sprint list
- Shows shortcut hint on the right of each row
- Recent commands section

**Любое действие из GUI должно иметь команду здесь.**

---

## 8.3. Система горячих клавиш

### Global

| Key | Action |
|-----|--------|
| `⌘K` | Command Palette |
| `⌘P` / `⌘O` | Search objects |
| `⌘N` | Quick Create (contextual) |
| `⌘\` | Toggle sidebar |
| `⌘.` | Toggle Peek |
| `⌘Enter` | Expand Peek ↔ Full |
| `⌘[` `⌘]` | Object back/forward |
| `⌘Z` | Undo (incl. mass plan when available) |
| `⌘⇧L` | Toggle theme |
| `/?` or `⌘/` | Shortcuts cheatsheet |
| `g then t` | Go Today |
| `g then s` | Go Sprint |
| `g then b` | Go Backlog |
| `g then r` | Go Roadmap |
| `g then l` | Go Load |
| `g then e` | Go Releases |

### Create sequences (Linear-like)

| Sequence | Action |
|----------|--------|
| `c then s` | Create Story |
| `c then e` | Create Epic |
| `c then i` | Create Initiative |
| `c then g` | Create Goal |
| `c then r` | Create Release |

### List / Backlog

| Key | Action |
|-----|--------|
| `J` / `K` | next/prev row |
| `X` | select |
| `Enter` | open Peek |
| `E` | inline edit title |
| `S` | status |
| `A` | assign |
| `P` | priority |
| `⇧⌘→` | commit to current sprint |
| `#` | labels |
| `V` | move to… (sprint/release) |

### Story Peek

| Key | Action |
|-----|--------|
| `1..6` | jump Work stages / tabs |
| `D` | add dependency |
| `W` | focus Work table |
| `⌘⇧U` | mark ready (if DoR ok) |

### Board

| Key | Action |
|-----|--------|
| `←/→` | move card across columns (transition) |
| `⌘⇧↑/↓` | reorder |

### Conflict with macOS

Не перехватывать system-reserved без нужды; документировать в cheatsheet.  
Palette всегда запасной путь.

---

## 8.4. Keyboard-first checklist (definition of done UX)

- Создать Story без мыши
- Запланировать Story в спринт без мыши
- Найти Release и открыть readiness без мыши
- Перейти в Load и понять bottleneck без мыши
