# ZS Events — Event Management & Production CRM

Lead pipeline, project staging, customer directory, GST quotations and
invoicing, and an event calendar for ZS Events, Bangalore.

## Stack

- **Frontend** — React 19, Vite 6, Tailwind CSS 4, TypeScript
- **API** — Express 4, mounted at `/api`
- **Database** — Supabase (Postgres). Falls back to an in-memory store,
  seeded with fixtures, when Supabase is not configured.
- **Auth** — Supabase Auth

The quotation suggestions and WhatsApp drafts are produced by a local,
self-contained engine (`src/server/assistant.ts`). No external AI service and
no API keys are involved.

## Run locally

**Prerequisites:** Node.js 20+

```bash
npm install
npm run dev
```

The app serves on <http://localhost:3000> — Express handles `/api/*` and Vite
serves the client from the same port.

### Environment

Copy `.env.example` to `.env.local` and fill in:

| Variable | Used by | Notes |
| --- | --- | --- |
| `SUPABASE_URL` | server | Project URL |
| `SUPABASE_SECRET_KEY` | server | Bypasses RLS — server only, never `VITE_`-prefixed |
| `VITE_SUPABASE_URL` | client | Same project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | client | Safe to ship in the browser bundle |

Without these the app still runs, using the in-memory store, but nothing
persists between restarts.

## Build

```bash
npm run build
```

Outputs the client to `dist/`. Deployment is configured for Vercel via
`vercel.json`, which serves `dist/` statically and routes `/api/*` to the
serverless function in `api/index.ts`.

## Fonts

The UI is set in Inter where it is available locally, falling back to the
platform UI font. No web fonts are fetched from a third-party CDN.
