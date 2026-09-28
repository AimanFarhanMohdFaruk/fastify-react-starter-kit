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
- Export `getData` in the **same** page file. Call models/session via **dynamic `import()` inside `getData`** so Node/DB deps stay out of the client bundle (do not static-import `app/models` at the top of the page).
- Compose with `layout` + `ui` + `shell` — avoid raw HTML + inline style objects for new UI.
- Local UI state only (open/closed, input drafts). **No** business filter/sort of collections in the client — ask the server.
- Mutations: `fetch` against `/api/*` controllers. Auth client is fine for Better Auth endpoints.
- Navigation: `react-router` `Link` (`to=…`), not Inertia.

## Feedback without full navigation

- For live widgets (job list), prefer **JSON API + local state**: `POST /api/…` then poll `GET /api/…` and `setState`. Avoid full page reloads so scroll stays put.
- Stop polling when no work is in flight (e.g. no `queued`/`running` jobs).

## Design-system adds

- New primitives: match existing `ui/` Base UI + `cn` + CVA patterns; register via `components.json` when using shadcn/coss CLI.
- Do not introduce a second CSS system or card-heavy layout language for marketing surfaces unless the page’s job requires it.

## Boundaries (reminder)

| May | Must not |
|-----|----------|
| Render route data; local UI state; `/api` fetch | Domain rules; meaningful client-side business filter/sort |
| Call Better Auth client for auth flows | Import `app/models` from client components (only inside `getData`) |
| Presentational hooks (`useMediaQuery`, theme) | Encode job/workflow logic in React |
