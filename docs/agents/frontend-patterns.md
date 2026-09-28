# Frontend patterns

`@fastify/react` + React SSR. UI stays presentation-only; domain lives in `app/`.

## Delivery

- Pages are route modules under `client/pages/` — one folder per URL segment, **`index.tsx`** as the route file (e.g. `pages/login/index.tsx` → `/login`). Home stays `pages/index.tsx` → `/`.
- Only put route modules under `pages/`; shared UI belongs in `client/components/`.
- HTML GETs are owned by `@fastify/vite` + `@fastify/react`; mutations and auth stay on Fastify under `/api/*`.
- Alias: `@/*` → `client/*`; `@app/*` → `app/*` (use in `getData` dynamic imports).
- Layout/providers: `client/layouts/default.jsx` wraps ThemeProvider/Toast.

## Component folders

| Folder | Role |
|--------|------|
| `components/ui` | Primitives (Button, Input, Field, …) — Base UI + CVA + tweakcn tokens |
| `components/layout` | Structure (Container, Section, …) |
| `components/shell` | App chrome (Main, ThemeProvider, providers) |
| `components/motion-primitives` | Motion wrappers |
| `components/screen` | **Page UI** — one folder per page, composed from ui/layout/shell |
| `components/core` | Shared non-primitive helpers (images, etc.) |
| `components/icons.tsx` | App icons |

Theme tokens live in `client/styles/globals.css` (tweakcn). Prefer token classes (`bg-background`, `text-muted-foreground`) over one-off colors.

## Pages vs screens

Keep route modules thin; put the visible UI in `components/screen/`.

| Layer | Path | Owns |
|-------|------|------|
| Route module | `client/pages/<segment>/index.tsx` | `getData`, `getMeta`, default export that reads `useRouteContext().data` and renders the screen |
| Screen | `client/components/screen/<segment>/<Name>.tsx` | Layout/UI, local state, `/api` fetch — **no** `@app` imports |

Example (dashboard):

```
client/pages/dashboard/index.tsx          → getData + <Dashboard email jobs />
client/components/screen/dashboard/dashboard.tsx  → interactive UI
```

- Import the screen **directly** (no barrel `index.ts`): `@/components/screen/dashboard/dashboard`.
- Name the screen after the page (`Dashboard`); name the route default something like `DashboardPage` if needed to avoid a clash.
- Tiny pages (e.g. a one-liner home) may keep UI inline until they grow — prefer `screen/` once there is real composition or client state.
- Screens may use `useState` / `useEffect`; that is normal SSR + hydration, not a Next `"use client"` boundary.
- Navigation: `react-router` `Link` (`to=…`).
- Local UI state only (open/closed, input drafts). **No** business filter/sort of collections in the client — ask the server.

## Data fetching

### Page load (SSR / first paint + client navigations)

`@fastify/react` convention — export `getData` from the **route module** (`client/pages/…/index.tsx`), not from the screen:

1. Runs on the server before SSR (and again via an internal JSON endpoint on client-side navigations).
2. Return value becomes `useRouteContext().data`; the page passes it into the screen as props.
3. May call session helpers / models via **dynamic** `import('@app/…')` inside `getData` only. Vite stubs `app/` for the **client** bundle (`vite.app-server-only.ts`); SSR still loads the real modules. Do **not** static-import `@app/*` at the top of a page or screen.
4. Auth gates: `ctx.reply.redirect(…)` then `return {}`.
5. Optional `getMeta()` — head tags (e.g. `{ title: '…' }`), not Fastify.

### Screens / live updates

`client/components/screen/**` (and other components) **never** import `@app/*`. They talk to Fastify over HTTP:

| Need | How |
|------|-----|
| Mutations / polls / refreshes | `fetch('/api/…')` — prefer helpers in `client/lib/api.ts` |
| Auth UI (sign in/out, magic link) | Better Auth `authClient` → `/api/auth/*` |
| Initial SSR props | From the page via props (from `getData`) — don’t re-fetch unless live |

Kit pattern for widgets (job list): **SSR seed from `getData` → props**, then `POST /api/…` + poll `GET /api/…` into screen state. Stop polling when no work is in flight.

### Boundaries

| May | Must not |
|-----|----------|
| `getData` → dynamic `import('@app/…')` | Static `@app` / `app/models` import in screens or page top-level |
| Screen: render props; local UI state; `/api` fetch | Domain rules; client-side business filter/sort |
| Better Auth client for auth flows | Encode job/workflow logic in React |
| Presentational hooks (`useMediaQuery`, theme) | Call Drizzle / pg-boss from `client/` |

## Design-system adds

- New primitives: match existing `ui/` Base UI + `cn` + CVA patterns; register via `components.json` when using shadcn/coss CLI.
- Do not introduce a second CSS system or card-heavy layout language for marketing surfaces unless the page’s job requires it.
