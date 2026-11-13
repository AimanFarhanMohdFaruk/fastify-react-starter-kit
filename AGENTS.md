# Agent guide

Rails-shaped Fastify + `@fastify/react` kit. Read these before growing features or UI.

## Always

- **Fat models**, thin controllers; **services** only for cross-model / model+queue / policy-heavy intake.
- Models never import `controllers/`, `queue`, or `client/` (enqueue from controllers/services only).
- **API controllers** — `app/controllers/<resource>/{index,handlers,dto}.ts` (even one route). Scan `index.ts` (`app.get/post` + `requireSession` when private). Exception: `auth.ts`.
- **Page loaders** — `app/controllers/<area>/loaders.ts` (`load*Page`: gate + query + `*Dto`). Page `getData` does **one** dynamic import of that loader — no multi-import `@app` / hand-maps in the page. Areas today: `admin`, `dashboard`, `home`, `login`.
- **One JSON seam** — `dto.ts` shapes HTTP; `/api` handlers **and** page loaders call `*Dto`. Client types via `import type` through `@/lib/api`.
- **Auth** — `requireSession` / `sessionUser` for private `/api`; `getSessionUser` / `gateAdminPage` / `isAdmin` for pages — never `role === 'admin'`.
- **Upload policy** — limits / accept / typed errors live in the service; boot + UI + handlers import them.
- **Queue** — stupid bus in `app/queue.ts`: `handlers` registry, typed `enqueue(name, args)`, `registerWorkers` (pg-boss). Do **not** require a domain row to enqueue.
- `client/` is presentation + route modules only — no domain rules, no client-side business filter/sort.
- Tests: **`node:test` + `node:assert`**, Testcontainers DB (never app `.env` `DATABASE_URL`), real Better Auth `testUtils` sessions — see testing patterns.

## Docs

| When | Read |
|------|------|
| How the kit is built (processes, seams, request paths) | [docs/architecture.md](docs/architecture.md) |
| Growing a feature (schema, domain, HTTP, jobs) | [docs/agents/grow-a-feature.md](docs/agents/grow-a-feature.md) |
| Frontend / pages / design-system work | [docs/agents/frontend-patterns.md](docs/agents/frontend-patterns.md) |
| Writing or extending tests (lanes, harness, must-nots) | [docs/agents/testing-patterns.md](docs/agents/testing-patterns.md) |
| Test strategy (why / hard rules) | [docs/testing.md](docs/testing.md) |

Stack decision and kit approach: [README.md](./README.md).
