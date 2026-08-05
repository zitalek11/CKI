# CKI Flow — сборка desktop (этап 14)

Приложение: Tauri 2 + React. Целевой артефакт для ЦКИ — **macOS `.dmg`**.

## Требования (macOS)

- macOS 11+ (Apple Silicon или Intel)
- Xcode Command Line Tools (`xcode-select --install`)
- Node.js 20+ / npm
- Rust stable (`rustup` → `rustc` ≥ 1.85)

```bash
cd cki-flow
npm install
npm run build:dmg
```

Готовый файл:

```
src-tauri/target/release/bundle/dmg/CKI Flow_0.1.0_*.dmg
```

Для конкретной архитектуры:

```bash
# Apple Silicon
npx tauri build --bundles dmg --target aarch64-apple-darwin

# Intel
npx tauri build --bundles dmg --target x86_64-apple-darwin
```

## CI (GitHub Actions)

Workflow: `.github/workflows/cki-flow-macos-dmg.yml`

| Триггер | Результат |
|---------|-----------|
| **Actions → Run workflow** (`workflow_dispatch`) | собирает DMG (arm64 + x64), кладёт в Artifacts |
| Тег `cki-flow-v*` (например `cki-flow-v0.1.0`) | то же + draft GitHub Release |

Перед DMG всегда прогоняются `npm test` и `npm run build` (web).

## Подпись и нотаризация (опционально)

Локальный / CI unsigned DMG ставится, но Gatekeeper может предупреждать.

Для распространения вне команды настройте secrets:

- `APPLE_CERTIFICATE` (base64 `.p12`)
- `APPLE_CERTIFICATE_PASSWORD`
- `APPLE_SIGNING_IDENTITY`
- `APPLE_ID` / `APPLE_PASSWORD` (app-specific) / `APPLE_TEAM_ID`

Entitlements: `src-tauri/entitlements.plist` (уже подключены в `tauri.conf.json`).

## Проверка без macOS

На Linux/Windows полный `.dmg` **не собирается** (нужен Apple toolchain).  
Можно проверить веб-часть:

```bash
cd cki-flow
npm test
npm run build
```

Конфиг бандла: `src-tauri/tauri.conf.json` → `bundle.targets: ["dmg", "app"]`.
