# Research: isolated test Postgres (never app `DATABASE_URL`)

Primary sources: [Testcontainers PostgreSQL (Node)](https://node.testcontainers.org/modules/postgresql/), [Docker Compose](https://docs.docker.com/compose/) (kit’s `docker-compose.yml`), [Drizzle migrator](https://orm.drizzle.team/docs/migrations) usage as in `scripts/migrate.ts`.

## Constraint (map)

Test runner owns the DB URL. **Never** read developer/production `DATABASE_URL` from `.env` / ambient env for tests.

## Options

| Option | How | Pros | Cons for this kit |
|--------|-----|------|-------------------|
| **A. Testcontainers** | `@testcontainers/postgresql` starts `pgvector/pgvector:pg18` (or postgres+vector), `getConnectionUri()`, migrate, teardown | URL comes from container API — cannot accidentally be `.env`; auto cleanup; random port | Extra dep; needs Docker daemon; cold start |
| **B. Compose test service** | Second compose file/profile: separate DB name/port, `npm test` sets URL in script only | Reuses known image/init SQL | Easy to point at wrong URL; shared state; manual lifecycle |
| **C. `CREATE DATABASE` on shared server** | Connect to admin DB with **hardcoded test admin URL** (not from `.env`), create ephemeral DB, migrate | Fast if compose postgres already up | Still a shared server; discipline required so admin URL isn’t `DATABASE_URL` |
| **D. Template DB** | Migrate once to template, `CREATE DATABASE … TEMPLATE` per file | Fast reset | More harness code; still needs a non-env base URL |

## Recommendation

**A — Testcontainers with `pgvector/pgvector:pg18`** (same family as [docker-compose.yml](../../docker-compose.yml)).

Why it fits “never `DATABASE_URL` from env”:

1. Connection string is **`container.getConnectionUri()`** ([module docs](https://node.testcontainers.org/modules/postgresql/)).
2. Global setup can assign **`process.env.DATABASE_URL` only inside the test process after clearing/ignoring dotenv** — or better: pass the URI into a test `db` factory that **does not call `dotenv/config`**. Today `app/db.ts` and `scripts/migrate.ts` both read `process.env.DATABASE_URL` after dotenv; the harness must set the URL **before** importing those modules, and test scripts must **not** load `.env` (e.g. avoid importing modules that side-effect dotenv, or run with an explicit empty/`TEST_` prefix and a dedicated test db module).

Practical lean pattern:

1. `--test-global-setup` starts PostgreSqlContainer (`IMAGE=pgvector/pgvector:pg18`), writes URI to a temp file or `process.env.TEST_DATABASE_URL` **only**.
2. Test helper builds drizzle with that URI; **rejects** if only `DATABASE_URL` from dotenv would be used without `TEST_DATABASE_URL`.
3. Run migrator against that URI (same `db/migrate` folder as `scripts/migrate.ts`).
4. Optional: container **snapshot** after migrate for fast restore between files ([snapshot API](https://node.testcontainers.org/modules/postgresql/)).
5. `globalTeardown` stops container.

Fixture reset: prefer **truncate app tables** or **restoreSnapshot** between tests; avoid relying on a developer’s `starter_kit` volume.

## Explicit non-recommendation

- Using `dotenv/config` + ambient `DATABASE_URL` pointing at local compose `starter_kit` — violates the map hard rule and destroys shared data.

## Kit follow-through (for strategy doc, not this ticket)

- Document that `npm test` must not load `.env` for DB.
- Likely need a test entry that sets URL before `app/db` is first imported (module singleton today).
