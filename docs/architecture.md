# Architecture

How this kit is put together: processes, seams, and request paths. For growing a feature, see [agents/grow-a-feature.md](agents/grow-a-feature.md). For pages and UI, see [agents/frontend-patterns.md](agents/frontend-patterns.md).

## Bet

Fastify owns HTTP. React SSR is a **plugin** (`@fastify/vite` + `@fastify/react`), not the product. Domain lives in fat models under `app/`. Two long-running Node processes share Postgres — not a serverless / App Router / RSC stack.

## Processes

| Process | Entry | Role |
|---------|-------|------|
| **web** | `cmd/web/main.ts` | Cookies, `/api/*` controllers, then Vite SSR for HTML |
| **worker** | `cmd/worker/main.ts` | pg-boss consumer only — never inside the web process |

Both talk to the same Postgres (`DATABASE_URL`). Optional Redis (`REDIS_URL`) is a per-process lazy singleton via `app/redis.ts`. Schema and migrations live under `app/models/schema.ts` → `db/migrate/` (Drizzle). Local object bytes live in RustFS (S3-compatible) via `app/object-store.ts`. Outbound email is `app/mail.ts` (SMTP → Inbucket locally, Resend in prod).

Boot order on web matters: register **API controllers before** `FastifyVite`, so `/api` is never swallowed by the SPA/SSR catch-all.

```
cmd/web
  ├── cookie + formbody + multipart
  ├── registerAuthRoutes / registerPostRoutes / registerWorkRoutes / registerDocumentRoutes   → /api/*
  └── FastifyVite + @fastify/react            → HTML pages
```

## Layers (MVC)

Dependency rule: **inward only**. Models never import controllers, queue, or `client/`.

```
client/pages  ──getData──►  app/controllers | app/models | app/services
client/screen ──fetch────►  /api ──► controllers ──► models | services | enqueue
cmd/worker    ──dequeue──►  app/queue.ts (registerWorkers) ──► services (optional models)
```

| Layer | Path | Owns |
|-------|------|------|
| **Models** | `app/models/` | Schema, invariants, queries, Better Auth tables |
| **Services** | `app/services/` | Cross-model or external side effect; upload policy; job bodies called from `queue` handlers |
| **Controllers** | `app/controllers/<resource>/` | Fluent `index.ts` + handlers + dto; `requireSession` on private routes → parse → one model/service → `*Dto` JSON |
| **Queue** | `app/queue.ts` | Stupid bus: `handlers` registry, typed `enqueue`, `getBoss`, `registerWorkers` |
| **Views** | `client/pages/` + `client/components/screen/` | Route modules + presentation |

Infra singletons (shared by web + worker): `app/db.ts` (Drizzle), `app/mail.ts`, `app/object-store.ts`, `app/redis.ts`, `app/queue.ts`. Controllers do not open those connections or talk to pg-boss / S3 / mail / Redis directly — except the intentional thin `enqueue` call from a work controller/service.

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

Mutations and Better Auth stay on Fastify:

| Surface | Example |
|---------|---------|
| Better Auth | `/api/auth/*` (handler in `app/controllers/auth`) |
| App JSON | `/api/posts` (CRUD), `/api/work` (enqueue), `/api/documents` (upload / list / get) |

Typical controller: `requireSession` on the route → parse → one model or service → `*Dto` → `reply.send`.

Resource JSON for Post / Document is shaped once in `app/controllers/<resource>/dto.ts`. Both `/api` handlers and page `getData` call those helpers; `client/lib/api.ts` re-exports the DTO types for screens.

Document upload policy (`DOCUMENT_MAX_BYTES`, `DOCUMENT_ACCEPT`, typed `UploadDocumentError`) lives in `app/services/upload-document.ts` — multipart limits, UI accept, and handler status mapping import from there.

## Queue path (stupid bus)

The queue is **not** coupled to a domain table. pg-boss holds delivery state (like Redis in Sidekiq); you do not model `pgboss.*`.

1. Caller `enqueue(name, args)` via `app/queue.ts` (e.g. from `POST /api/work`, or `uploadDocument` → `parse_document`).
2. Worker process calls `registerWorkers()` — one `boss.work` on `default`.
3. Looks up `handlers[name]` and calls the service with `args`.
4. Service may touch models if the product needs it — **not required** to enqueue.

Demo: `shout` sleeps + logs (no row). Upload enqueues `parse_document` so PDF/text extract does not block the web request.

## Server-only boundary (`app/` ↔ client bundle)

Page modules are shared source for **two** Vite environments: **ssr** (Node) and **client** (browser). A static or dynamic import of `@app/…` from a page would otherwise pull `postgres` into the browser bundle.

This kit’s answer is `vite.app-server-only.ts`, registered in `vite.config.ts`:

| Environment | Import of anything under `app/` |
|-------------|----------------------------------|
| **ssr** | Real modules (DB, auth, domain) |
| **client** | Synthetic stubs with the same export names |

You write clean imports — `await import('@app/models/post')` — no `?server` query, no `server-imports.d.ts`. Aliases:

- Vite + tsconfig: `@app/*` → `app/*`
- Vite + tsconfig: `@/*` → `client/*`

**Convention:** only call `@app` from inside `getData` (dynamic import). Prefer one import of a page loader (`app/controllers/…/loaders`) over scattering gate/query/dto in the route module. Screens and page top-level must not import `@app`.

## Auth

Better Auth lives in `app/models/auth` (schema + server instance). The web process mounts its handler under `/api/auth/*`.

| Need | Use |
|------|-----|
| Session in `getData` | `getSessionUser(req)` (null when banned) |
| Admin flag / authz | `isAdmin(user)` — never `role === 'admin'` |
| Gate `/admin/**` | `gateAdminPage(req, reply)` — check `{ ok }`, not truthiness |
| Private `/api` | `requireSession` preHandler; `sessionUser(req)` in handlers |

The browser uses the Better Auth client against the same `/api/auth/*` routes.

## What is intentionally not here

- No Next App Router, RSC, or framework-owned data cache layer
- No domain rules or business filter/sort in `client/`
- No job consumer inside `cmd/web`
- No domain row required just to enqueue background work
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
