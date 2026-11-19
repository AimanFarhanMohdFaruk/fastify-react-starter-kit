# Case: `getData` must not `reply.redirect`

**Status:** fixed in kit (`gatePage` / loaders return `{ redirectTo }`; pages use `pageRedirect`).  
**Applies to:** any `@fastify/react` app using page loaders + client-side navigations.

## Symptom

Client navigation (or hard visit that re-fetches data) to a gated / legacy path shows a **blank page**. Server log:

```text
Reply was already sent
```

Often on `GET /-/data/<route>` (e.g. `/-/data/dashboard`, `/-/data/admin`). Full document SSR may still “work” via HTTP 302; **SPA data fetches break**.

## Root cause

`@fastify/react` runs the same `getData({ req, reply })` for:

1. **Full SSR** — HTML document.
2. **Client navigations** — internal **`/-/data/…` JSON** endpoint. The client expects a JSON body (route `data`), not an HTTP redirect.

`reply.redirect(...)` inside a loader / `gatePage` **sends the response early**. The framework then tries to serialize `getData`’s return value → “Reply was already sent” → empty client data → blank UI.

Documented today in a way that invites the bug:

- `app/controllers/page-gate.ts` — `reply.redirect('/login'|'/dashboard')` on deny.
- `docs/architecture.md` — “or the loader redirects”.
- `CONTEXT.md` — gate “Owns redirect / 403 side effects”.

## Required pattern

**Loaders / gates return data only.** Redirects are a field; the page performs navigation.

```ts
// loader / gate — never reply.redirect for page flows
return { redirectTo: '/admin/shops' }
// or on auth miss:
return { redirectTo: '/login' }
```

```tsx
// client/pages/.../index.tsx
import { Navigate } from 'react-router'

export default function Page() {
  const { data } = useRouteContext() as { data: { redirectTo?: string; /* … */ } }
  if (data.redirectTo) return <Navigate to={data.redirectTo} replace />
  // …
}
```

**Still OK:** `reply.code(403)` + `{ forbidden: true }` (JSON body with status).  
**Not OK:** `reply.redirect` (or any early `reply.send`) from `getData` / page-gate / `load*Page`.

Verify: `curl -i http://127.0.0.1:3000/-/data/<path>` → `200` + `content-type: application/json` + `{"redirectTo":"…"}` (or real page data). Not `302`.

## Kit fix checklist (for the agent that owns this repo)

1. **`page-gate.ts`** — stop calling `reply.redirect`. On deny return `{ ok: false, data: { redirectTo: '…' } }` (typed). Drop “Mutates reply on deny (redirect…)” contract; keep `reply.code(403)` for admin forbidden.
2. **Every `load*Page`** that currently relies on empty `{}` after redirect — ensure deny path surfaces `redirectTo` (gate already returns it; index/legacy bounce loaders return `{ redirectTo }` for their own hops).
3. **Every route module** that can receive `redirectTo` — render `<Navigate to={data.redirectTo} replace />` before the screen (admin index, login guest bounce, dashboard, etc.).
4. **Docs** — `architecture.md`, `frontend-patterns.md`, `CONTEXT.md`, README admin note: teach **JSON `redirectTo` + `<Navigate>`**, not HTTP redirect from loaders.
5. **Smoke** — client-nav from a signed-in admin into a legacy/gated path; confirm no blank page and no “Reply was already sent”.

## One-liner for AGENTS / architecture

Page loaders return JSON only — including redirects as `{ redirectTo }`. Client pages `<Navigate>`; never `reply.redirect` in `getData` / `gatePage` (breaks `/-/data/*`).
