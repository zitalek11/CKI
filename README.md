# CKI Base

Premium NSD Corporate Intelligence Workspace — базовый проект витрины данных ЦКИ MOEX.

## Stack

React 19 · TypeScript · Vite · TanStack Router/Query · Recharts · Tailwind

## Quick start

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

- Portal roadmap: [ROADMAP.md](./ROADMAP.md)
- **CKI Flow** — архитектура системы управления продуктовой разработкой команды ЦКИ (этап проектирования, без кода): [`docs/cki-flow/`](./docs/cki-flow/)
