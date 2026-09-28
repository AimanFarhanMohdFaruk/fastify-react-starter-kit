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
The signed-in User’s app home (`/dashboard`) — not the admin surface.
_Avoid_: Admin dashboard, console

**Admin dashboard**:
The gated `/admin` tree for Admins (users & jobs visibility in v1).
_Avoid_: Backoffice, CMS
