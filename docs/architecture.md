# Architecture

How this kit is put together: processes, seams, and request paths. For growing a feature, see [agents/grow-a-feature.md](agents/grow-a-feature.md). For pages and UI, see [agents/frontend-patterns.md](agents/frontend-patterns.md).

## Bet

Fastify owns HTTP. React SSR is a **plugin** (`@fastify/vite` + `@fastify/react`), not the product. Domain lives in fat models under `app/`. Two long-running Node processes share Postgres — not a serverless / App Router / RSC stack.

## Processes

| Process | Entry | Role |
|---------|-------|------|
| **web** | `cmd/web/main.ts` | Cookies, `/api/*` controllers, then Vite SSR for HTML |
| **worker** | `cmd/worker/main.ts` | pg-boss consumer only — never inside the web process |

Both talk to the same Postgres (`DATABASE_URL`). Schema and migrations live under `app/models/schema.ts` → `db/migrate/` (Drizzle).

Boot order on web matters: register **API controllers before** `FastifyVite`, so `/api` is never swallowed by the SPA/SSR catch-all.

```
cmd/web
  ├── cookie + formbody
  ├── registerAuthRoutes / registerJobRoutes   → /api/*
  └── FastifyVite + @fastify/react            → HTML pages
```

## Layers (MVC)

Dependency rule: **inward only**. Models never import controllers, jobs, or `client/`.

```
client/pages  ──getData──►  app/controllers | app/models | app/services
client/screen ──fetch────►  /api ──► controllers ──► models | services
cmd/worker    ──dequeue──►  app/jobs ──► models | services
```

| Layer | Path | Owns |
|-------|------|------|
| **Models** | `app/models/` | Schema, invariants, queries, status transitions, Better Auth tables |
| **Services** | `app/services/` | Cross-model or model + queue / external side effect |
| **Controllers** | `app/controllers/` | Auth gate, parse, call one model/service, JSON |
| **Jobs** | `app/jobs/` | Thin `boss.work` adapters → model/service |
| **Views** | `client/pages/` + `client/components/screen/` | Route modules + presentation |

`app/db.ts` is the shared Drizzle + `postgres` client. Controllers do not open DB connections or talk to pg-boss directly.

## Page request path (HTML)

Route modules live under `client/pages/` (folder → URL; home is `pages/index.tsx`).

1. Browser `GET /dashboard`.
2. `@fastify/react` runs the route’s `getData({ req, reply })` **on the server** before SSR.
3. `getData` may dynamically `import('@app/…')` — session helpers, models — and return props (or `reply.redirect`).
4. React SSR renders the default export; `useRouteContext().data` is the `getData` return value.
5. HTML ships with hydrated route context. Client React takes over for navigation and interactivity.

On **client-side** navigations, the same `getData` runs again on the server via an internal JSON endpoint (`/-/data/…`); the client does not execute model code.

Screens under `client/components/screen/` receive props from the page. They never import `@app/*`; live updates go through `fetch('/api/…')`.

## API request path (JSON)

Mutations, polls, and Better Auth stay on Fastify:

| Surface | Example |
|---------|---------|
| Better Auth | `/api/auth/*` (handler in `app/controllers/auth`) |
| App JSON | `/api/jobs` (list / enqueue) |

Typical controller: session gate → parse → one model or service → `reply.send`.

## Jobs path

1. Service (e.g. `enqueueDemoJob`) persists a row via the model, then `boss.send`.
2. Worker process registers `boss.work` in `app/jobs/`.
3. Adapter calls model work (status transitions, long-running logic).
4. UI that needs freshness polls `GET /api/…` after SSR seeded the list.

## Server-only boundary (`app/` ↔ client bundle)

Page modules are shared source for **two** Vite environments: **ssr** (Node) and **client** (browser). A static or dynamic import of `@app/…` from a page would otherwise pull `postgres` into the browser bundle.

This kit’s answer is `vite.app-server-only.ts`, registered in `vite.config.ts`:

| Environment | Import of anything under `app/` |
|-------------|----------------------------------|
| **ssr** | Real modules (DB, auth, domain) |
| **client** | Synthetic stubs with the same export names |

You write clean imports — `await import('@app/models/demo-job')` — no `?server` query, no `server-imports.d.ts`. Aliases:

- Vite + tsconfig: `@app/*` → `app/*`
- Vite + tsconfig: `@/*` → `client/*`

**Convention:** only call `@app` from inside `getData` (dynamic import). Screens and page top-level must not import `@app`.

## Auth

Better Auth lives in `app/models/auth` (schema + server instance). The web process mounts its handler under `/api/auth/*`. Pages use `getSessionUser` from `getData` for SSR gates; the browser uses the Better Auth client against the same routes.

## What is intentionally not here

- No Next App Router, RSC, or framework-owned data cache layer
- No domain rules or business filter/sort in `client/`
- No job consumer inside `cmd/web`
- No second CSS system beyond Tailwind v4 + tweakcn tokens in `client/styles/`

## Map of docs

| Question | Doc |
|----------|-----|
| Why this stack / setup / deploy | [README.md](../README.md) |
| How layers fit together | This file |
| Add a feature end-to-end | [agents/grow-a-feature.md](agents/grow-a-feature.md) |
| Pages, screens, `getData`, design system | [agents/frontend-patterns.md](agents/frontend-patterns.md) |
| Writing tests | [agents/testing-patterns.md](agents/testing-patterns.md) |
| Test strategy | [testing.md](testing.md) |
