# Research: Better Auth admin plugin for this kit

Primary sources: [Admin plugin docs](https://www.better-auth.com/docs/plugins/admin), [Admin plugin MDX (schema fields)](https://raw.githubusercontent.com/better-auth/better-auth/main/docs/content/docs/plugins/admin.mdx), [Drizzle adapter](https://www.better-auth.com/docs/adapters/drizzle), [CLI generate omits admin fields (#7611)](https://github.com/better-auth/better-auth/issues/7611). Kit: `app/models/auth.ts`, `app/models/schema.ts`.

## Recommendation

**Prefer the admin plugin** over a home-grown `role` column alone. It matches the locked map (Admin = elevated User), ships `role` + ban/impersonation schema the product may grow into, and exposes first-party APIs. For this kit’s **hand-owned Drizzle schema**, add the plugin fields **manually** in `schema.ts` and migrate with drizzle-kit — do not rely on `auth migrate` / CLI generate to invent them.

v1 read-only admin UI only needs **session user role** for gates; ban/impersonation stay unused but columns can exist.

## Schema (must add by hand)

From [Admin → Schema](https://www.better-auth.com/docs/plugins/admin#schema):

| Table | Field | Type | Purpose |
|-------|--------|------|---------|
| `user` | `role` | string (optional, default `user`) | `"user"` / `"admin"` (comma-separated if multi-role) |
| `user` | `banned` | boolean | Ban flag |
| `user` | `banReason` | string | Ban reason |
| `user` | `banExpires` | date | Ban expiry |
| `session` | `impersonatedBy` | string | Admin id when impersonating |

Docs: migrate via `npx auth migrate` / `npx auth generate`, **or** “See the Schema section to add the fields manually.” With Drizzle, [issue #7611](https://github.com/better-auth/better-auth/issues/7611) documents that **CLI generate does not emit admin plugin fields** — kit path remains: edit `app/models/schema.ts` → `npm run db:generate` → `npm run db:migrate`.

## Wiring

1. `plugins: [admin(), magicLink(...)]` on server `betterAuth` ([installation](https://www.better-auth.com/docs/plugins/admin#installation)).
2. Client `adminClient()` is required for **client** admin calls (`authClient.admin.*`). v1 **getData-only** gates can use server session only; add client plugin when/if UI mutations appear.
3. Defaults: `defaultRole: "user"`, `adminRoles: ["admin"]` ([options](https://www.better-auth.com/docs/plugins/admin#options)).

## “Is this user an admin?” for SSR

An admin is a user with the `admin` role **or** an id in `adminUserIds` ([usage](https://www.better-auth.com/docs/plugins/admin#usage)). After `auth.api.getSession`, the session user includes plugin fields (including `role`). Kit model helper should treat Admin as: role token includes `admin` (handle comma-separated multi-role) and/or id ∈ configured `adminUserIds`. Prefer reading session/DB role over re-implementing access-control statements in v1.

## First admin / promote script

Chicken-and-egg: `auth.api.setRole` **requires an admin session** ([setRole](https://www.better-auth.com/docs/plugins/admin#set-user-role)).

First-party bootstrap options:

| Approach | Notes |
|----------|--------|
| `npx auth@latest create-admin --email … --name … --role admin` | Documented first-admin path after schema applied |
| Direct Drizzle update of `user.role` for an existing email | Fits kit scripts (`tsx scripts/…`); stays compatible with plugin field |
| `adminUserIds: […]` in config | Env/id allowlist — map marked lasting allowlist **out of scope**; ok only as temporary fog, not the model |

**Do not** use `setRole` for the *first* admin without already having an admin session. Subsequent promotes can use `setRole` once an admin exists (still out of v1 UI).

## What v1 must not lean on

- **Ban / unban / impersonation / revoke sessions** — plugin capabilities; leave columns unused; no admin UI for them in v1 (aligns with map fog/out of scope).
- **Custom access-control (`ac` / extra roles)** — defaults `admin`/`user` are enough until fog clears.
- **`/api/admin` Better Auth HTTP admin routes for the kit’s users/jobs lists** — those lists are **app** domain (`demo_jobs`, user directory via Drizzle/`getData`), not Better Auth’s admin user-management UI. Plugin is for **role identity + future user-mgmt APIs**, not a substitute for admin pages.

## Verdict vs plain `role` column

| | Admin plugin | Plain `role` only |
|--|--------------|-------------------|
| Schema | Same core `role` (+ ban/impersonation fields) | Just `role` |
| Session / ecosystem | First-party; create-admin; setRole later | DIY forever |
| Kit Drizzle path | Manual fields + drizzle-kit (CLI gap) | Same manual work for `role` |

**Keep the plugin.** Cost is a few nullable columns and `admin()` registration; benefit is staying on the Better Auth admin path the map already chose.

## Kit follow-through (for the spec, not this ticket)

- Extend `user` / `session` in `schema.ts`; migrate.
- Register `admin()` beside `magicLink`.
- `isAdmin` / `requireAdmin` in a fat model (or auth model helpers) reading session user.
- Promote script: prefer kit `tsx` script updating `role` by email **or** document `create-admin` — decide in [Promote-admin script interface](../../.scratch/admin/issues/04-promote-admin-script.md).
- Test auth instance must include `admin()` + schema fields so `testUtils` users can be given `role: 'admin'`.
