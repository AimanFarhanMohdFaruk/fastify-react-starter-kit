# Research: Better Auth real sessions for tests

Primary source: [Better Auth Test Utils](https://www.better-auth.com/docs/plugins/test-utils). Kit wiring: `app/models/auth.ts`, `app/controllers/auth.ts`.

## Recommendation

Use Better Auth’s first-party **`testUtils()`** plugin on a **test-only auth instance**:

1. `createUser` + `saveUser` against the test DB  
2. `login` / `getAuthHeaders` for Fastify `inject`  
3. `getCookies` for Playwright `context.addCookies`

Do **not** stub `getSessionUser` or forge unsigned cookies.

## First-party API

From [test-utils docs](https://www.better-auth.com/docs/plugins/test-utils):

- Plugin: `import { testUtils } from 'better-auth/plugins'` then `plugins: [testUtils()]`.
- Access: `const ctx = await auth.$context; const test = ctx.test`.
- **Designed for test environments only** — privileged helpers on `ctx.test` (create sessions, persist/delete users). Docs recommend a **separate test-only auth config**, not production `app/models/auth.ts`.
- `testUtils()` does **not** register public HTTP bypass routes; risk is shipping privileged helpers in the production server context if the plugin is left on the prod instance.

### Helpers that match this kit’s lanes

| Helper | Use |
|--------|-----|
| `createUser` / `saveUser` | Persist a real user row via auth adapter (Drizzle/Postgres) |
| `login({ userId })` | Creates a real session; returns `headers`, `cookies`, `token` |
| `getAuthHeaders({ userId })` | `Headers` with session cookie — use with `auth.api.getSession` or map into `inject({ headers/cookies })` |
| `getCookies({ userId, domain })` | Playwright/Puppeteer-shaped cookies (`name`, `value`, `domain`, …) |

Official Playwright example uses `getCookies` + `context.addCookies` then `page.goto('/dashboard')`.

### TypeScript caveat

Conditional `...(process.env.NODE_ENV === 'test' ? [testUtils()] : [])` can break inference of `ctx.test`. Prefer a dedicated `auth.test.ts` (or factory) that always includes `testUtils()` for the test process.

## Fit with this kit

- Prod auth: `betterAuth` + `drizzleAdapter` + `magicLink` in `app/models/auth.ts`.
- Tests: clone that config against the **test DB**, add `testUtils()`, keep magicLink send as no-op or capture if needed later.
- Controllers calling `auth.api.getSession` will see real sessions when inject/Playwright send the cookie from `login`/`getCookies`.

## Alternative (worse)

Sign-up + sign-in over `/api/auth/*` to harvest `Set-Cookie` — works but slower and couples tests to HTTP auth UX. Docs and upstream discussion point test helpers / `returnHeaders` sign-in as patterns; **`testUtils.login` is the lean first-party path** for “real session without bypass stubs.”

## Version note

Confirm `testUtils` is exported from the kit’s installed `better-auth` version (`package.json` currently `^1.7.6`) when implementing; docs are current on better-auth.com. If missing in the resolved version, fall back to sign-in + `returnHeaders` until upgrade.
