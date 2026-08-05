# Установка CKI Report Studio на macOS

## Готово на этом Mac

1. **Приложение установлено:**
   - `/Applications/CKI Report Studio.app`
   - `~/Applications/CKI Report Studio.app`
2. **DMG на рабочем столе:**
   - `~/Desktop/CKI Report Studio_0.1.0_aarch64.dmg`
3. **Копия в репозитории:**
   - `cki-report-studio/dist-macos/CKI Report Studio_0.1.0_aarch64.dmg`

Запуск: Spotlight → «CKI Report Studio» или Applications.

Данные отчётов: `~/Documents/CKI Report Studio/reports/`

---

## Если macOS блокирует запуск

Приложение не подписано Apple Developer ID (ad-hoc build).

```bash
xattr -cr "/Applications/CKI Report Studio.app"
```

Или: Системные настройки → Конфиденциальность и безопасность → «Всё равно открыть».

---

## Переустановка из DMG

1. Откройте `CKI Report Studio_0.1.0_aarch64.dmg`
2. Перетащите **CKI Report Studio** в **Applications**
3. Запустите из Applications

---

## Сборка заново (разработчику)

Требования: Node 22+, Rust (`rustup`), Xcode Command Line Tools.

```bash
cd cki-report-studio
npm install
npm run build:dmg
```

Артефакты: `src-tauri/target/release/bundle/dmg/` (или cargo target dir).

---

## Web-режим без установки

```bash
cd cki-report-studio
npm run dev
```

В браузере данные в `localStorage`, не в Documents.
