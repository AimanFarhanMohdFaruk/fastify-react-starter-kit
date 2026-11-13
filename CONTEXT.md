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
The signed-in User’s app home (`/dashboard`) — reports demo + document upload.
_Avoid_: Admin dashboard, console

**Admin dashboard**:
The gated `/admin` tree for Admins (users & reports visibility in v1).
_Avoid_: Backoffice, CMS

**Report**:
A User-owned async work record (`reports` table). Enqueued via `/api/reports`, processed by the worker (`app/jobs/report.ts`), status updated on the model.
_Avoid_: Job (when meaning the domain record — “job” means the queue worker / pg-boss message)

**Document**:
A User-owned uploaded file (`.md` / `.txt` / `.pdf`). Bytes live in the object store; metadata and extracted text live in Postgres (`documents`).
_Avoid_: Attachment, asset, blob (when meaning the domain record)
