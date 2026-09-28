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
| `components/screen` | Page-specific compositions (optional) |
| `components/core` | Shared non-primitive helpers (images, etc.) |
| `components/icons.tsx` | App icons |

Theme tokens live in `client/styles/globals.css` (tweakcn). Prefer token classes (`bg-background`, `text-muted-foreground`) over one-off colors.

## Pages

- Default export; read `getData` results via `useRouteContext().data`.
- Optional `getMeta()` — `@fastify/react` head tags (e.g. `{ title: '…' }`), not Fastify.
- Compose with `layout` + `ui` + `shell` — avoid raw HTML + inline style objects for new UI.
- Local UI state only (open/closed, input drafts). **No** business filter/sort of collections in the client — ask the server.
- Navigation: `react-router` `Link` (`to=…`).

## Data fetching

### Page load (SSR / first paint + client navigations)

`@fastify/react` convention — export `getData` from the **same** route module (`client/pages/…/index.tsx`):

1. Runs on the server before SSR (and again via an internal JSON endpoint on client-side navigations).
2. Return value becomes `useRouteContext().data`.
3. May call session helpers / models via **dynamic** `import('@app/…')` inside `getData` only — keeps Node/DB out of the browser bundle. Do **not** static-import `@app/*` at the top of a page or component.
4. Auth gates: `ctx.reply.redirect(…)` then `return {}`.

Example shape: dashboard seeds `email` + `jobs` in `getData`; home seeds `title` + `email`.

### Client components / live updates

`client/components/**` and in-page effects **never** import `@app/*`. They talk to Fastify over HTTP:

| Need | How |
|------|-----|
| Mutations / polls / refreshes | `fetch('/api/…')` — prefer helpers in `client/lib/api.ts` |
| Auth UI (sign in/out, magic link) | Better Auth `authClient` → `/api/auth/*` |
| Initial SSR props | From the parent page’s `getData` via props or `useRouteContext()` — don’t re-fetch unless live |

Kit pattern for widgets (job list): **SSR seed from `getData`**, then `POST /api/…` + poll `GET /api/…` into React state. Stop polling when no work is in flight.

### Boundaries

| May | Must not |
|-----|----------|
| `getData` → dynamic `import('@app/…')` | Static `@app` / `app/models` import in components or page top-level |
| Render route data; local UI state; `/api` fetch | Domain rules; client-side business filter/sort |
| Better Auth client for auth flows | Encode job/workflow logic in React |
| Presentational hooks (`useMediaQuery`, theme) | Call Drizzle / pg-boss from `client/` |

## Design-system adds

- New primitives: match existing `ui/` Base UI + `cn` + CVA patterns; register via `components.json` when using shadcn/coss CLI.
- Do not introduce a second CSS system or card-heavy layout language for marketing surfaces unless the page’s job requires it.
