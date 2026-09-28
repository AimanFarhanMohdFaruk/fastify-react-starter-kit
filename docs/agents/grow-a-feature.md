# Grow a feature

Ordered path for new capability. Complete each step before the next.

## 1. Model first

Put domain + persistence in `app/models/`.

- Schema / columns → `app/models/schema.ts` (Drizzle).
- Persist the change → `npm run db:generate` (writes under `db/migrate/` + journal), then `npm run db:migrate` (Drizzle migrator / `__drizzle_migrations`). Do not hand-author one-off SQL in place of generate; the only intentional hand edit in the initial migration is `CREATE EXTENSION vector`.
- Invariants, queries, status transitions → functions on the model module (e.g. `createX`, `listXForUser`, `runXWork`).
- Auth tables stay Better Auth–shaped; app domain tables sit beside them in the same schema module.

**Done when:** schema + migration are generated, migrate applies cleanly, and the feature can be exercised from a model function (or a short script) without HTTP.

## 2. Service only if cross-model

Add `app/services/` when the use-case spans **more than one model** or model + queue/external side effect that isn’t “the model’s own work.”

| Put in **model** | Put in **service** |
|------------------|--------------------|
| Single-aggregate rules, CRUD, status machine | Orchestrate model A + model B |
| Persist then return row | Persist row **and** enqueue pg-boss / call another system |
| Pure domain helpers | Multi-step workflows that would otherwise fatten a controller |

Example in this kit: `enqueueDemoJob` creates the row (model) then `boss.send` (queue) — that’s a service.

**Done when:** either you called the model directly from the controller, or a named service owns the multi-step flow. Controllers do not inline orchestration.

## 3. Thin controller (`/api`)

Add or extend `app/controllers/<resource>.ts` and register it from `cmd/web/main.ts` **before** `FastifyVite`.

Controller may:

1. Auth / session gate  
2. Parse body/query/params  
3. Call **one** model or service  
4. Map result → **JSON** (`reply.send` / status codes)

Controller must not:

- Encode business rules (validation beyond “required field present” belongs in the model)
- Talk to Drizzle or pg-boss directly
- Render HTML pages (those live in `client/pages` via `getData`)

**Done when:** a curl against `/api/…` reaches the model/service and returns the right JSON.

## 4. Jobs (if async)

- Queue name + `boss.work` adapter → `app/jobs/` (thin: dequeue → model/service).
- Long work / status updates → `app/models/` (e.g. `runDemoJobWork`).
- Register workers from `cmd/worker/main.ts` only — never run the consumer inside `cmd/web`.

**Done when:** `npm run worker` processes a message and the model row reflects success/failure.

## 5. Page last

- Route module → `client/pages/` (`getData` + default component).
- Reusable UI → `client/components/` (see [frontend-patterns.md](frontend-patterns.md)).
- Initial props from `getData` (may call models); live updates via `/api` poll into React state.

**Done when:** the happy path works end-to-end with presentation-only UI.

## Folder seam (checklist)

```
client/       → pages + design system; getData may call models; components must not own domain
controllers/  → /api HTTP only
services/     → cross-model / model+queue
jobs/         → dequeue adapters only
models/       → domain + DB; never import adapters above
```

## Naming

- Controllers named by resource (`jobs`, `auth`) — not `index` grab-bags.
- One `register*Routes(app)` export per controller file; `cmd/web` boots API then Vite.
