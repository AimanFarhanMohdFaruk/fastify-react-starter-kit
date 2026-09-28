# Research: lean Playwright for Fastify + `@fastify/react` SSR

Primary sources: [Playwright webServer](https://playwright.dev/docs/test-webserver), [Playwright authentication / storageState](https://playwright.dev/docs/auth), Better Auth [test-utils Playwright example](https://www.better-auth.com/docs/plugins/test-utils).

## Recommendation

- Separate lane: **`npm run test:e2e`** → `playwright test` (not under `node --test`).
- Config: `playwright.config.ts` at repo root; specs under `test/e2e/`.
- `webServer` starts the kit’s production-like web (`npm run build` once in CI, then `npm start`) with **test DB env injected in `webServer.env`**, never relying on developer `.env` `DATABASE_URL`.
- Auth: Prefer Better Auth **`getCookies` + `addCookies`** (or a setup project that writes `storageState`) over clicking magic-link email in v1.
- Chromium-only locally/CI for lean defaults.

## Layout

```
playwright.config.ts
test/e2e/
  smoke.spec.ts
  auth.setup.ts          # optional: write storageState
playwright/.auth/        # gitignored storageState output
```

Keep Playwright deps (`@playwright/test`) out of the Node model/`/api` lane.

## webServer

From [webServer docs](https://playwright.dev/docs/test-webserver):

- `command` + `url` (e.g. `http://localhost:3000`) + `reuseExistingServer: !process.env.CI`.
- **`env`**: pass test DB URL / `APP_URL` explicitly so the spawned server does not depend on ambient `.env` secrets for DB.
- Optional second process in the `webServer` array if job flows need `npm run worker` (v1 strategy may omit worker until a ticket needs async job UI).

Dev (`tsx cmd/web`) is fine for local iteration; CI should prefer **build + `NODE_ENV=production npm start`** for closer SSR parity.

## Auth cookie reuse

Two lean patterns (both valid):

1. **Per-test / fixture**: test-only auth `getCookies` → `context.addCookies` ([Better Auth example](https://www.better-auth.com/docs/plugins/test-utils)).
2. **Setup project + `storageState`**: [Playwright auth guide](https://playwright.dev/docs/auth) — setup project depends-before chromium; saves `playwright/.auth/user.json`.

For this kit, (1) aligns with the map’s “real Better Auth session helpers” and avoids maintaining a browser login ritual for magic-link. Use (2) if many specs share one user and cookie inject from Node is awkward.

## Separation from `node:test`

| Lane | Command | Runner |
|------|---------|--------|
| Models + `/api` | `npm test` | `node --test --import tsx` |
| Browser E2E | `npm run test:e2e` | Playwright |

Do not import Playwright into model tests; do not run `*.spec.ts` under `node --test`.

## Scope reminder (map)

E2E covers pages (including SSR/`getData` indirectly). No separate `getData` harness in v1.
