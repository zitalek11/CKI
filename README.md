# CKI Base

Premium NSD Corporate Intelligence Workspace — базовый проект витрины данных ЦКИ MOEX.

## Apps

| App | Path | Description |
|-----|------|-------------|
| CKI Portal | `src/` | Витрина данных / analytics |
| **CKI Report Studio** | [`cki-report-studio/`](./cki-report-studio/) | Desktop-редактор еженедельного HTML-отчёта |

```bash
cd cki-report-studio && npm install && npm run dev
```

Архитектура Report Studio: [`docs/cki-report-studio/`](./docs/cki-report-studio/).

## Portal stack

React 19 · TypeScript · Vite · TanStack Router/Query · Recharts · Tailwind

## Quick start (portal)

```bash
npm install
cp .env.example .env
npm run dev
```

Dev server: http://localhost:5173/

## API modes

Set `VITE_API_MODE` in `.env`:

- `auto` — live MOEX CCI with mock fallback (default)
- `live` — live API only
- `mock` — demo data

Optional MOEX Passport credentials for protected endpoints: `MOEX_USER`, `MOEX_PASSWORD`.

## Docs

See [ROADMAP.md](./ROADMAP.md) for portal development stages.
