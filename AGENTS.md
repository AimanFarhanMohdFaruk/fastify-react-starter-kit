# Agent guide

Rails-shaped Fastify + `@fastify/react` kit. Read these before growing features or UI.

## Always

- **Fat models**, thin controllers/jobs; **services** only for cross-model workflows.
- Models never import `controllers/`, `jobs/`, or `client/`.
- `client/` is presentation + route modules only — no domain rules, no client-side business filter/sort.

## Docs

| When | Read |
|------|------|
| Growing a feature (schema, domain, HTTP, jobs) | [docs/agents/grow-a-feature.md](docs/agents/grow-a-feature.md) |
| Frontend / pages / design-system work | [docs/agents/frontend-patterns.md](docs/agents/frontend-patterns.md) |

Stack decision: see repo `STACK.md` (parent of this kit when nested) or this kit’s `README.md`.
