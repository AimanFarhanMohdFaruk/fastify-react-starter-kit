# Grow a feature

Ordered path for new capability. Complete each step before the next.

## 1. Model first

Put domain + persistence in `app/models/`.

- Schema / columns → `app/models/schema.ts` (Drizzle).
- Persist the change → `npm run db:generate` (writes under `db/migrate/` + journal), then `npm run db:migrate` (Drizzle migrator / `__drizzle_migrations`). Do not hand-author one-off SQL in place of generate; the only intentional hand edit in the initial migration is `CREATE EXTENSION vector`.
- Invariants, queries, status transitions → functions on the model module (e.g. `createX`, `listXForUser`, `runXWork`).
- Auth tables stay Better Auth–shaped; app domain tables sit beside them in the same schema module.
- Admin checks → `isAdmin` / `requireAdmin` in `app/models/admin` — never `user.role === 'admin'` (roles may be comma-separated).

**Done when:** schema + migration are generated, migrate applies cleanly, and the feature can be exercised from a model function (or a short script) without HTTP.

## 2. Service only if cross-model

Add `app/services/` when the use-case spans **more than one model** or model + queue/external side effect that isn’t “the model’s own work.”

| Put in **model** | Put in **service** |
|------------------|--------------------|
| Single-aggregate rules, CRUD, status machine | Orchestrate model A + model B |
| Persist then return row | Persist row **and** enqueue pg-boss / call another system |
| Pure domain helpers | Multi-step workflows that would otherwise fatten a controller |

Example in this kit: `enqueueReport` creates the row (model) then `boss.send` (queue) — that’s a service.

**Upload / policy-heavy intake:** own limits, accept strings, and typed failures in the service (see `upload-document.ts`: `DOCUMENT_MAX_BYTES`, `DOCUMENT_ACCEPT`, `UploadDocumentError`). Multipart boot, harness, UI, and handlers **import** those — do not scatter magic numbers or scrape `Error.message` for HTTP status.

**Done when:** either you called the model directly from the controller, or a named service owns the multi-step flow. Controllers do not inline orchestration.

## 3. Thin controller (`/api`)

Add `app/controllers/<resource>/` and register it from `cmd/web/main.ts` **and** `test/harness/app.ts` **before** `FastifyVite`. Reference: `app/controllers/reports/`.

```
app/controllers/<resource>/
  index.ts       # API index — app.get/post(path, handlerRef); scan here
  handlers.ts    # thin: parse → one model/service → *Dto JSON
  dto.ts         # HTTP input + response shaping (not domain)
```

**Always** use the folder layout — even for a single route. No flat `app/controllers/<resource>.ts` route modules. Exception: `app/controllers/auth.ts` (Better Auth catch-all, `getSessionUser`, `requireSession`, `sessionUser`, `gateAdminPage`).

`index.ts` example:

```ts
export async function registerReportRoutes(app: FastifyInstance) {
  app.get('/api/reports', { preHandler: requireSession }, list)
  app.post('/api/reports', { preHandler: requireSession }, create)
}
```

| Need | Use |
|------|-----|
| Private `/api` | `{ preHandler: requireSession }` on the route; handlers use `sessionUser(req)` |
| Public `/api` | Omit `requireSession` |
| Response JSON | `*Dto` helpers in `dto.ts` — same helpers `getData` must call |
| Typed service failures | `instanceof UploadDocumentError` (or similar) → status; no substring matching |

Controller may:

1. Auth / session gate (prefer route `preHandler`)  
2. Parse body/query/params (or dto parsers)  
3. Call **one** model or service  
4. Map result → **JSON** via dto (`reply.send` / status codes)

Controller must not:

- Encode business rules (validation beyond “required field present” belongs in the model)
- Talk to Drizzle or pg-boss / S3 / mail / Redis directly
- Render HTML pages (those live in `client/pages` via `getData`)
- Hand-roll a second JSON shape that diverges from `dto.ts`

**Done when:** a curl against `/api/…` reaches the model/service and returns the right JSON.

## 4. Jobs (if async)

- **Infra:** pg-boss client belongs with other process singletons (`app/db`, `app/mail`, …) — intended module `app/queue.ts` (`getBoss`). Do not treat the client as “part of a job adapter.” (Today the client still lives at `app/jobs/queue.ts`; move toward `app/queue.ts` when touching queue code.)
- **Adapters:** `app/jobs/<name>.ts` — thin `boss.work` → model/service only. Share queue **name + payload type** with the enqueue service.
- Long work / status updates → `app/models/` (e.g. `runReportWork`).
- Register workers from `cmd/worker/main.ts` only — never run the consumer inside `cmd/web`.

**Done when:** `npm run worker` processes a message and the model row reflects success/failure.

## 5. Page last

- Route module → `client/pages/<segment>/index.tsx` (home: `pages/index.tsx`) — `getData` / `getMeta` + render screen.
- Page UI → `client/components/screen/<segment>/…` (see [frontend-patterns.md](frontend-patterns.md)); import the `.tsx` directly (no barrel).
- `getData`: dynamic `import('@app/…')` only; seed lists with the same `*Dto` as `/api`; Admin flag via `isAdmin(user)`; `/admin/**` via `gateAdminPage`.
- Live updates in the screen via `/api` (`client/lib/api.ts`). Screens never import `@app/*`.
- Client DTO types: `import type` re-exported from controller `dto.ts` through `@/lib/api` — do not redefine field lists in the page.

**Done when:** the happy path works end-to-end with presentation-only UI.

## 6. Tests

Add coverage at the right seam (see [testing-patterns.md](testing-patterns.md)):

- New model behavior → `test/models/…`
- New `/api` route → register in `test/harness/app.ts` + `test/api/…` (keep multipart limits in sync via shared service constants)
- New user-visible page flow → `test/e2e/…` only if model/`/api` cannot prove it

**Done when:** `npm test` (and `npm run test:e2e` if you added an E2E) passes.

## Folder seam (checklist)

```
client/       → pages + design system; getData may call models/dto/auth; screens must not own domain
controllers/  → /api HTTP only (folder per resource)
services/     → cross-model / model+queue / policy-heavy intake
jobs/         → dequeue adapters only (not the boss client long-term)
queue / db / mail / object-store / redis → process infra singletons
models/       → domain + DB; never import adapters above
```

## Naming

- Controllers named by resource folder (`jobs/`, `documents/`) — not grab-bags; not flat `*.ts` route modules.
- One `register*Routes(app)` export from the controller package (`index.ts`); `cmd/web` boots API then Vite.
