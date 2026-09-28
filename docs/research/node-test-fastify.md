# Research: `node:test` + Fastify (TypeScript ESM)

Primary sources: [Node.js test runner](https://nodejs.org/api/test.html), [Node.js TypeScript](https://nodejs.org/api/typescript.html), [Running TypeScript with a runner](https://nodejs.org/en/learn/typescript/run), [Fastify Testing guide](https://github.com/fastify/fastify/blob/main/docs/Guides/Testing.md).

## Recommendation for this kit

- Run tests with **`node --test --import tsx`** (kit already depends on `tsx`).
- Assert with **`node:assert/strict`** (or `t.assert` helpers on the test context).
- Build a **testable Fastify app factory** (register cookie/formbody + controllers; skip Vite in `/api` tests) and use **`app.inject()`**; always **`t.after(() => app.close())`**.

## Runner + TypeScript

Node’s CLI test runner is started with `--test` and discovers files matching patterns such as `**/*.test.js` ([test runner docs](https://nodejs.org/api/test.html)).

For full TypeScript (including this kit’s `"type": "module"` ESM), Node documents registering **tsx** via:

```bash
node --import=tsx …
```

([TypeScript modules](https://nodejs.org/api/typescript.html), [learn/typescript/run](https://nodejs.org/en/learn/typescript/run)).

Lean script shape for this kit:

```bash
node --test --import tsx "test/**/*.test.ts"
```

Native type-stripping exists for erasable syntax, but **`.tsx` is unsupported** under strip-types; this kit’s page/UI tests are out of the Node lane anyway. Prefer **tsx** for consistency with `cmd/web` / `cmd/worker`.

## Hooks and lifecycle

From [`node:test`](https://nodejs.org/api/test.html):

- Suite/file hooks: `before`, `after`, `beforeEach`, `afterEach` (also on test context).
- **`--test-global-setup`**: module exporting `globalSetup` / `globalTeardown` run once around the whole run — fit for starting a shared test Postgres (see isolated-test-db research).

## Fastify `/api` testing

Fastify’s official [Testing guide](https://github.com/fastify/fastify/blob/main/docs/Guides/Testing.md) recommends **`inject()`** (light-my-request) over a listening port:

- Ensures plugins are ready.
- Supports `method`, `url`, `headers`, `cookies`, `payload`.
- Example uses **`node:test`** + `t.assert.strictEqual`.
- Recommends **`t.after(() => app.close())`** so external connections close.

For this kit: extract or duplicate a **minimal app builder** used by tests that registers the same controllers as `cmd/web/main.ts` **without** `FastifyVite` when only `/api` is under test. Full HTML/SSR stays in the Playwright lane.

## Assert

Use `import assert from 'node:assert/strict'` or the test context assert API documented alongside `node:test`. No Vitest/Jest matchers.

## Out of this note

- Spinning Postgres (separate research).
- Better Auth cookies for `inject` (separate research).
- Playwright (separate lane / runner).
