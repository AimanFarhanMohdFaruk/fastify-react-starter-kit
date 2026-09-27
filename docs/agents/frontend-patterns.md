# Frontend patterns

Inertia + React SSR. UI stays presentation-only; domain lives in `app/`.

## Delivery

- Pages are **Inertia** components under `web/pages/` — server props in, visits/forms out.
- SSR is on by default (`web/ssr.tsx`, `alex-fastify-inertiajs`).
- Alias: `@/*` → `web/*` (components, hooks, lib, styles).

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

Theme tokens live in `web/styles/globals.css` (tweakcn). Prefer token classes (`bg-background`, `text-muted-foreground`) over one-off colors.

## Pages

- Default export; props typed from what the controller renders.
- Compose with `layout` + `ui` + `shell` — avoid raw HTML + inline style objects for new UI.
- Local UI state only (open/closed, input drafts). **No** business filter/sort of collections in the client — ask the server.
- Mutations: `useForm` / `router.post` / `router.get` against controller routes. Auth client is fine for Better Auth endpoints.

## Feedback without full navigation

- Prefer **server-driven** updates: reload props (`router.get` / partial `only: [...]`) rather than inventing a parallel JSON API for the same page.
- Inertia `usePoll` / `reload` always hits **`window.location`** — keep the browser on a real GET route (PRG after POST), or poll an explicit URL with `router.get('/dashboard', …)`.
- Stop polling when no work is in flight (e.g. no `queued`/`running` jobs).

## Forms & redirects

- After POST, controllers should **redirect** to a GET page so URL and poll targets stay aligned.
- Flash messages: short-lived props (query flash keys today); clear naturally on next plain GET.

## Design-system adds

- New primitives: match existing `ui/` Base UI + `cn` + CVA patterns; register via `components.json` when using shadcn/coss CLI.
- Do not introduce a second CSS system or card-heavy layout language for marketing surfaces unless the page’s job requires it.

## Boundaries (reminder)

| May | Must not |
|-----|----------|
| Render props; local UI state; Inertia visits | Domain rules; meaningful client-side business filter/sort |
| Call Better Auth client for auth flows | Import `app/models` or talk to the DB |
| Presentational hooks (`useMediaQuery`, theme) | Encode job/workflow logic in React |
