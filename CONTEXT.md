# Starter kit

Rails-shaped Fastify + React product kit: HTTP and jobs on the server, React as presentation.

## Language

**User**:
A person with a Better Auth account who uses the signed-in app (e.g. `/dashboard`).
_Avoid_: Customer, member, account (when meaning the person)

**Admin**:
A User with an elevated role who may access the `/admin` surface.
_Avoid_: Superuser, operator, staff (unless a finer role is introduced later)

**User dashboard**:
The signed-in User’s app home (`/dashboard`) — posts CRUD, fire-and-forget work enqueue, document upload.
_Avoid_: Admin dashboard, console

**Admin dashboard**:
The gated `/admin` tree for Admins (users & posts visibility in v1).
_Avoid_: Backoffice, CMS

**Post**:
A User-owned content record (`posts` table). Synced CRUD via `/api/posts` — not tied to the queue.
_Avoid_: Job, report (removed); do not create a Post just to enqueue work

**Work / queue job**:
A named message on the stupid bus (`enqueue(name, args)` in `app/queue/` → adapter → `handlers`). Prod adapter: pg-boss; tests: inline via `setQueueAdapter`. No domain row required. Demo handler: `shout`.
_Avoid_: Treating pg-boss / Redis rows as app models; `parse:'sync'` on Document intake

**Document**:
A User-owned uploaded file (`.md` / `.txt` / `.pdf`). Bytes live in the object store; metadata and extracted text live in Postgres (`documents`). Upload enqueues `parse_document` on the stupid bus.
_Avoid_: Attachment, asset, blob (when meaning the domain record)

**Page loader**:
A `load*Page` function in `app/controllers/<area>/loaders.ts` that owns gate + query + `*Dto` for SSR. Route `getData` imports one loader only.
_Avoid_: Multi-importing `@app` or hand-mapping DTOs inside the page module

**Page gate**:
The SSR access policy applied by a Page loader via `gatePage` in `app/controllers/page-gate.ts` (`public` | `signedIn` | `guestOnly` | `admin`). Deny returns JSON `{ redirectTo }` (pages `<Navigate>`) or `{ forbidden: true }` with `reply.code(403)`. Never `reply.redirect` — breaks `/-/data/*`. Not used for `/api` (that stays `requireSession`).
_Avoid_: `reply.redirect` in loaders/`gatePage`; copying `getSessionUser` into each loader; `gateAdminPage` (removed)

**Domain error**:
A typed failure thrown from a model or service (`AppError` and subclasses in `app/errors.ts`, plus `UploadDocumentError`). `composeWebApp` maps it to HTTP JSON; handlers do not catch for status.
_Avoid_: `throw new Error('…')` for request-facing validation; scraping `Error.message` for status codes
