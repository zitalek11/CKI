# 12. User Journey и обоснование решений

## 12.1. Сквозной User Journey (first run → close quarter)

```
1. Первый запуск
   - Welcome lite (1 экран): Product name, invite team later, "Start with Quarter"
   - Не onboarding из 12 шагов

2. System setup (минимум)
   - Team people + RoleSkills
   - Calendar (default RU business) 
   - Publish starter Workflow Templates (API/Docs/Integration/Spike/Infra)

3. Plan Quarter
   - Goals → Initiatives → envelopes
   - Commit Plan → baseline snapshot
   - Today начинает показывать health

4. Create Epic inside Initiative

5. Create User Story
   - Template auto
   - WorkItems + deps generated (delight moment)

6. Groom → Ready (DoR checklist)

7. Sprint Planning
   - Commit from Ready
   - Watch Load bars
   - Resolve dep warnings

8. Execution week(s)
   - Board / Story Work table updates
   - Today surfaces blockers & overloads
   - PM replans with preview+undo

9. Release shaping
   - Add must stories
   - Watch readiness gates
   - Freeze → Ship

10. Close Sprint
    - Carry-over proposals (not silent)
    - Velocity recorded

11. Close Quarter
    - Goals achieved/missed
    - Snapshots + learnings
    - Archive noise
```

Каждый этап доступен из ⌘K; мышь не обязательна.

---

## 12.2. Day-in-the-life (опытный PM)

| Время | Действие | Экран |
|-------|----------|-------|
| 09:30 | Открыл приложение | Today — 3 сигнала |
| 09:32 | Разбрал blocker | Story Peek → Deps |
| 09:40 | Докинул 2 Story | ⌘N ×2 |
| 10:00 | Sprint replan | Plan → Sprint Replan preview |
| 11:00 | Sync с архитектором | Initiative full tree |
| 15:00 | Release check | Release Console |
| 17:00 | Load glance for tomorrow | Insights → Load |

Цель UX: этот день без «борьбы с инструментом».

---

## 12.3. Обоснование ключевых UX-решений

### UX-D1. Today вместо Dashboard
Dashboard = наблюдение. Today = решения. Для 8-часового PM это важнее графиков.

### UX-D2. Plan объединяет Quarter и Sprint
Одна ментальная зона планирования; меньше прыжков по IA.

### UX-D3. Timeline не отдельный раздел
Отдельный Gantt провоцирует ручное «рисование плана». Режим Roadmap держит проекцию модели.

### UX-D4. Peek-first object UX
Полные страницы медленнее для triage. Peek закрывает 80% действий.

### UX-D5. Table-first Backlog
Карточки бэклога красивы, но медленны для ранжирования и bulk.

### UX-D6. Work table — герой Story
Ценность продукта — автогенерация работ; её надо показать сразу, не прятать.

### UX-D7. Command Palette обязателен
Raycast-паттерн — единственный способ масштабировать действия без раздувания UI.

### UX-D8. Replan preview + Undo
Доверие важнее «мгновенного хаоса». Mass ops без diff возвращают страх физической доски.

### UX-D9. Calm visuals / dual theme
Снижает усталость за 8 часов; Dark с первого дня.

### UX-D10. Kanban вторичен
Соответствует Domain принципу: board ≠ source of truth; иначе команда снова «живёт в колонках».

### UX-D11. Load, не «Capacity» в UI
Слово понятнее широкому кругу; в модели термин Capacity сохранён.

### UX-D12. Signals with suggested actions
Аналитика без next step бесполезна в ежедневном ритме.

---

## 12.4. Соответствие требованиям этапа

| Требование | Документ |
|------------|----------|
| UX-концепция | 01 |
| IA / структура | 02 |
| Навигация | 03 |
| Сценарии | 04 |
| Экраны | 05–07 |
| Search / Palette / Hotkeys | 08 |
| Notifications / Analytics | 09 |
| Design System + themes | 10 |
| Empty / Error / Motion / a11y | 11 |
| User Journey + решения | 12 |

---

## 12.5. Граница этапа

Этот пакет — **законченный UX-проект** для последующей реализации (wireframes/hi-fi/code).

На этапе не создавались: React, TypeScript, HTML, CSS, backend, SQL, файлы приложения.
