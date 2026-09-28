# Job list UI updates without scroll jump

Research note for the personal starter-kit dashboard enqueue + status refresh.

## Current behavior

1. `POST /jobs` enqueues, then **redirects** to `GET /dashboard?flash=…` ([`app/controllers/jobs.ts`](../../app/controllers/jobs.ts)).
2. Dashboard polls with `router.get('/dashboard', …, { only: ['jobs'], preserveState: true, preserveScroll: true })` ([`web/pages/Dashboard.tsx`](../../web/pages/Dashboard.tsx)).

The **scroll-to-top** feeling comes mainly from the **enqueue visit**, not the poll:

- Inertia **resets scroll by default** on visits unless `preserveScroll: true` ([Manual visits — Scroll preservation](https://inertiajs.com/docs/v3/the-basics/manual-visits)).
- `useForm().post` / `router.post` default **`preserveState: true`** but **`preserveScroll: false`** ([same docs](https://inertiajs.com/docs/v3/the-basics/manual-visits); also [Forms](https://inertia-rails.dev/guide/forms)).
- Following a **302 to `/dashboard`** is still an Inertia page visit; without `preserveScroll` on that client visit, the window jumps to top.
- Polls already pass `preserveScroll: true`, so they should not re-scroll if nothing else is wrong.

PRG (redirect after POST) was added so the browser URL stays on a real GET route (earlier bug: URL stuck on `/jobs`, polls 404’d). That constraint remains unless enqueue posts to a dashboard URL.

## Options (same-stack first)

### A. Keep PRG; set `preserveScroll: true` on the POST

```ts
form.post('/jobs', {
  preserveScroll: true,
  onSuccess: () => form.reset('payload'),
})
```

Inertia carries visit options through the redirect follow. Smallest change. Still a full Dashboard prop refresh after redirect (unless combined with `only`).

**Fit:** default kit fix.

### B. POST to the page you’re already on

e.g. `POST /dashboard/jobs` or `POST /dashboard` with an intent, then `redirect('/dashboard')` or re-render Dashboard. Client:

```ts
form.post('/dashboard/jobs', { preserveScroll: true, preserveState: true })
```

URL never becomes `/jobs`. Same Inertia model; clearer than posting to a foreign path.

**Fit:** good if you want PRG without a “foreign” action URL.

### C. No redirect — render Dashboard from `POST /jobs` + `preserveUrl`

Server returns `reply.inertia.render('Dashboard', props)` again. Client:

```ts
form.post('/jobs', { preserveScroll: true, preserveUrl: true })
```

[`preserveUrl`](https://inertiajs.com/docs/v3/the-basics/manual-visits) keeps the address bar on `/dashboard` even though the request was `/jobs`. Watch Inertia version support and history edge cases; you previously hit bugs when URL and poll target diverged—`preserveUrl` is the intentional fix for that class of problem.

**Fit:** fewer round-trips; slightly sharper API surface.

### D. Partial reload after enqueue (`only: ['jobs', 'flash']`)

On success (with A/B/C), request only the props that changed. Server still must support partial reloads (Inertia `X-Inertia-Partial-Data`). Reduces work; scroll still needs `preserveScroll`.

**Fit:** polish on top of A–C.

### E. JSON fragment + local React state

`POST /api/jobs` → `{ job }`; `GET /api/jobs` polled; update `useState` without Inertia visits. No scroll side effects. Splits a second transport beside Inertia props (acceptable for a widget; fights “one page props” purity).

**Fit:** if job list becomes a dense live widget.

### F. SSE / WebSocket push

Server pushes status; client patches state or triggers `router.reload({ only: ['jobs'], preserveScroll: true })`. Best latency; more infra. Still prefer `preserveScroll` if using Inertia reload.

**Fit:** later, if polling feels wrong at scale.

## Recommendation for this kit

1. **Immediate:** A — `preserveScroll: true` on enqueue `form.post` (and keep poll as-is).
2. **Optional cleanup:** B — move action under `/dashboard/…` so PRG never invents `/jobs` as a page URL.
3. **Hold** E/F until product needs push or a non-Inertia widget.

Polling every 1.5s with `preserveScroll: true` is already the right Inertia-shaped live update; the redirect after POST is the scroll culprit.

## Adopted (kit migration)

The kit left Inertia for **`@fastify/react`** and adopted **option E**: `POST /api/jobs` + poll `GET /api/jobs` into React state on the dashboard page. No PRG, no scroll jump from page visits. See `client/pages/dashboard/index.tsx` and `app/controllers/jobs.ts`.
