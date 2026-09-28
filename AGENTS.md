# Agent guide

Rails-shaped Fastify + `@fastify/react` kit. Read these before growing features or UI.

## Always

- **Fat models**, thin controllers/jobs; **services** only for cross-model workflows.
- Models never import `controllers/`, `jobs/`, or `client/`.
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
