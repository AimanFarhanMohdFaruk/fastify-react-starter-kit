# Testing

Lean strategy for this kit. Harness lives under `test/` (Node) and `e2e/` (Playwright); see `npm test` / `npm run test:e2e`.

**Writing tests:** [agents/testing-patterns.md](agents/testing-patterns.md). Seams: [architecture.md](architecture.md). Background: [research/](research/).

## Lanes

| Lane       | What it covers                          | Runner                             |
| ---------- | --------------------------------------- | ---------------------------------- |
| **Models** | Domain + Drizzle against real Postgres  | `node:test` + `node:assert/strict` |
| **`/api`** | Thin controllers via Fastify `inject()` | same                               |
| **E2E**    | Browser against SSR pages               | Playwright (Chromium)              |

SSR `getData` has **no** dedicated harness in v1 — Playwright hits the pages. React component / screen unit tests are **out**.

## Hard rules

1. Node tests use **`node:test`** and **`node:assert/strict`** only — no Vitest, Jest, or other runners.
2. Tests **never** use the developer/production `DATABASE_URL` from `.env`. The runner owns an isolated Postgres URL (Testcontainers).
3. Auth in tests uses **real Better Auth sessions** (first-party test helpers) — no stubbing `getSessionUser` or forging unsigned cookies.
4. Do not add a fourth lane for `getData` or for React Testing Library unless this strategy is deliberately revised.

## Node lane (models + `/api`)

### Layout and command

- Specs: `test/**/*.test.ts`
- Invoke (when wired): `node --test --import tsx "test/**/*.test.ts"` (e.g. `npm test`)

### Database

- Start **Testcontainers** with `pgvector/pgvector:pg18` (same family as local Compose).
- Take the URI from the container API (`getConnectionUri()`), migrate with the kit’s `db/migrate` folder, then run tests.
- Do **not** load `.env` for DB config in the test process. Set the test URI before first import of modules that open a pool (today `app/db.ts` reads `DATABASE_URL` at load — the harness must supply a test-owned URL and avoid dotenv clobbering it with the app `.env`).
- **Reset:** truncate app tables between tests (or per file). Container snapshot/restore after migrate is an allowed optimization, not required.

### `/api` with `inject`

- Build a **minimal Fastify app** that registers the same cookies/formbody + controllers as `cmd/web`, **without** `FastifyVite`, when only JSON routes are under test.
- Use `app.inject({ method, url, headers, cookies, payload })`.
- Always `t.after(() => app.close())`.

### Models

- Call model functions directly against the test DB (same URI).
- Prefer asserting invariants and status transitions here; keep HTTP mapping tests in the `/api` lane.

## Auth helpers

- Maintain a **test-only** Better Auth instance that mirrors prod config (Drizzle adapter, plugins) and adds Better Auth **`testUtils()`** — not on the production `app/models/auth` export shipped to `cmd/web`.
- Typical flow: `createUser` → `saveUser` → `login` / `getAuthHeaders` (for `inject`) or `getCookies` (for Playwright).
- **Default for E2E auth:** `getCookies` + `browserContext.addCookies`. Playwright `storageState` setup projects are allowed if many specs share one user.

## E2E lane (Playwright)

### Layout and command

- Specs: `e2e/`
- Config: `playwright.config.ts`
- Invoke (when wired): `npm run test:e2e` → `playwright test`
- Default browser: **Chromium only**

### webServer

- Playwright `webServer` runs `tsx test/e2e-web.ts` (Testcontainers + web). Do **not** reuse a developer `npm run dev` (`reuseExistingServer: false`).
- Prefer production-like boot in CI later (`vite build` then `NODE_ENV=production npm start`); v1 local/CI both use the harness entry.
- **v1:** do **not** require starting `npm run worker` for E2E. Job list / async UI can wait; cover enqueue/list via model and `/api` tests first.

## Scripts

| Script | Role |
|--------|------|
| `npm test` | Node lane (`tsx test/run-tests.ts` → Testcontainers + `node:test`) |
| `npm run test:e2e:install` | Download Chromium (`PLAYWRIGHT_BROWSERS_PATH=0`) |
| `npm run test:e2e` | Playwright (starts harness web + Testcontainers DB) |

Requires Docker. E2E needs a one-time `npm run test:e2e:install`. Playwright always boots its own server (does not reuse developer `npm run dev`).

## Agent must-nots

- Do not introduce Vitest/Jest “just for DX.”
- Do not point tests at Compose `starter_kit` via `.env` `DATABASE_URL`.
- Do not bypass auth with stubs in place of `testUtils` sessions.
- Do not put domain assertions only in Playwright when a model or `/api` test would do.
- Do not start a `getData`-only or React unit-test stack without revising this strategy.

## Research

| Topic                          | Note                                                                               |
| ------------------------------ | ---------------------------------------------------------------------------------- |
| `node:test` + Fastify `inject` | [research/node-test-fastify.md](research/node-test-fastify.md)                     |
| Isolated Postgres              | [research/isolated-test-db.md](research/isolated-test-db.md)                       |
| Better Auth sessions           | [research/better-auth-test-sessions.md](research/better-auth-test-sessions.md)     |
| Playwright + SSR               | [research/lean-playwright-fastify-ssr.md](research/lean-playwright-fastify-ssr.md) |
