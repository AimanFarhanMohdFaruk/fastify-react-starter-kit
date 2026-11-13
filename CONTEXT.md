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
A named message on the stupid bus (`enqueue(name, args)` in `app/queue.ts` → pg-boss → `handlers`). No domain row required. Demo handler: `shout`.
_Avoid_: Treating pg-boss / Redis rows as app models

**Document**:
A User-owned uploaded file (`.md` / `.txt` / `.pdf`). Bytes live in the object store; metadata and extracted text live in Postgres (`documents`).
_Avoid_: Attachment, asset, blob (when meaning the domain record)
