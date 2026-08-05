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

## Apps

| App | Path | Description |
|-----|------|-------------|
| CKI Portal | `src/` | Витрина данных / analytics |
| **CKI Flow** | [`cki-flow/`](./cki-flow/) | Desktop workspace управления продуктовой разработкой ЦКИ (Tauri) |

```bash
cd cki-flow && npm install && npm run dev
```

## Docs

- Portal roadmap: [ROADMAP.md](./ROADMAP.md)
- **CKI Flow** architecture / domain / UX: [`docs/cki-flow/`](./docs/cki-flow/)
