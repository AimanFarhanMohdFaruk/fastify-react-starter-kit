# Testing patterns

How to add tests in this kit. Strategy and hard rules: [docs/testing.md](../testing.md). Harness code: `test/harness/`.

## Pick a lane

| Behavior under test | Put the test in | Runner |
|---------------------|-----------------|--------|
| Model invariant, query, status transition | `test/models/<name>.test.ts` | `npm test` |
| `/api` status codes, JSON shape, auth gate | `test/api/<resource>.test.ts` | `npm test` |
| User-visible page after SSR / cookies | `test/e2e/<name>.spec.ts` | `npm run test:e2e` |

Prefer the highest seam that still proves the behavior: **model → `/api` → E2E**. Do not re-prove domain rules only in Playwright.

**Out of v1:** React component/screen unit tests; dedicated `getData` harness (E2E covers pages).

**Done when:** you chose one lane and the file path matches the table.

## Node tests (models + `/api`)

Always:

1. Use `node:test` + `node:assert/strict` only.
2. Truncate in `beforeEach` via `truncateAppTables()` from `test/harness/db`.
3. Create users/sessions with `createSessionUser` / helpers from `test/harness/auth` — not stubs.
4. Never read developer `.env` `DATABASE_URL` for resets (the runner owns Testcontainers and sets `TEST_DATABASE_URL`).

### Model test

```ts
import assert from 'node:assert/strict'
import { beforeEach, describe, test } from 'node:test'
import { createX } from '../../app/models/x'
import { createSessionUser } from '../harness/auth'
import { truncateAppTables } from '../harness/db'

describe('x model', () => {
  beforeEach(async () => {
    await truncateAppTables()
  })

  test('…', async () => {
    const { user } = await createSessionUser()
    // call model, assert with literals / known outcomes
  })
})
```

**Done when:** `npm test` fails red then green for the new behavior without HTTP.

### `/api` test

```ts
import assert from 'node:assert/strict'
import { beforeEach, describe, test } from 'node:test'
import { buildApiApp } from '../harness/app'
import { createSessionUser } from '../harness/auth'
import { truncateAppTables } from '../harness/db'

describe('/api/…', () => {
  beforeEach(async () => {
    await truncateAppTables()
  })

  test('…', async (t) => {
    const { headers } = await createSessionUser()
    const app = await buildApiApp()
    t.after(() => app.close())

    const res = await app.inject({
      method: 'GET',
      url: '/api/…',
      headers: { cookie: headers.get('cookie')! },
    })
    assert.equal(res.statusCode, 200)
  })
})
```

- Use `buildApiApp()` (controllers only — **no** Vite; wraps `composeWebApp` from `app/config.ts`).
- Always `t.after(() => app.close())`.
- Register new `/api` controllers in `app/config.ts` (`composeWebApp`) — harness and `cmd/web` both use it.

**Done when:** inject covers the auth gate and JSON contract; domain details already covered (or added) at the model seam.

## E2E (Playwright)

1. Apply harness DB URL from `test/.database-url` **before** importing `test/harness/auth` (dynamic import order matters — see `test/e2e/dashboard.spec.ts`).
2. `truncateAppTables()` then `createSessionUser` + `sessionCookiesForPlaywright` → `context.addCookies`.
3. Assert visible UI (`getByText` / roles), not implementation details.
4. Do **not** start the worker in v1; do **not** set `reuseExistingServer: true` against a developer `npm run dev`.

**Done when:** `npm run test:e2e` shows the user-visible outcome (after `npm run test:e2e:install` once).

## Harness map

| Module | Use for |
|--------|---------|
| `test/harness/db.ts` | Testcontainers URL, `applyTestEnv`, `truncateAppTables` |
| `test/harness/auth.ts` | Test-only Better Auth + `testUtils()` (`createSessionUser`, cookies) |
| `test/harness/app.ts` | `buildApiApp()` → `composeWebApp` without Vite for `inject` |
| `test/run-tests.ts` | `npm test` bootstrap |
| `test/e2e-web.ts` | Playwright `webServer` entry |

Extend these instead of inventing a second DB or auth path.

## Queue in Node tests

For anything that calls `enqueue` (Document upload, `/api/work`, …):

```ts
import { createInlineAdapter, setQueueAdapter } from '../../app/queue'

beforeEach(() => setQueueAdapter(createInlineAdapter()))
afterEach(() => setQueueAdapter(null))
```

Inline `send` runs the job immediately and records `{ name, args }`. Do **not** add `parse:'sync'` on Document intake — the adapter is the test seam. Do **not** start the worker process in Node tests.

## Must not

- Vitest, Jest, or another Node runner.
- Point tests at Compose `starter_kit` via `.env` `DATABASE_URL`.
- Stub `getSessionUser` or forge unsigned cookies.
- Put `testUtils()` on production `app/models/auth`.
- Add React Testing Library / `getData`-only suites without revising [docs/testing.md](../testing.md).
- Reintroduce Document `parse:'sync'` — use `setQueueAdapter(createInlineAdapter())`.
