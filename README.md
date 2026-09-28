# Fastify React starter

A **Rails-shaped** Node starter: Fastify owns HTTP, React SSR is a plugin (not the product), and domain lives in fat models — not in the frontend.

Built as an alternative to defaulting every app to **Next.js**. You keep React and SSR, without adopting App Router, RSC, or a framework that reinvents itself every major.

**Stack:** Fastify · [`@fastify/react`](https://vite.fastify.dev/react/) (Vite SSR) · Drizzle · Better Auth · pg-boss · **Postgres 18 + pgvector** (Docker)

## Why this exists

Next.js is a fine default for UI-first products and platform deploy. It is a poor default when you want:

- A real **server** you control (routes, cookies, workers, long-running jobs)
- **Stable seams** that look like Rails MVC, not framework file conventions
- Less time chasing breaking changes in how SSR / caching / data fetching “should” work this quarter

This kit bets on boring Node: **one web process + one worker**, Postgres as the source of truth, React as presentation.

## Approach (MVC)

| Rails idea       | Here                                                                         |
| ---------------- | ---------------------------------------------------------------------------- |
| Fat models       | `app/models/` — schema, invariants, queries, status transitions              |
| Thin controllers | `app/controllers/` — auth gate, parse, call one model/service, JSON          |
| Views            | `client/pages/` — `@fastify/react` route modules (`getData` + UI)            |
| Jobs             | `app/jobs/` + `cmd/worker` — pg-boss adapters; work stays in models/services |
| Services         | `app/services/` — **only** when a use-case spans models or model + queue     |

**Rules of the road**

- Models never import `controllers/`, `jobs/`, or `client/`.
- Controllers stay thin; they do not talk to Drizzle or pg-boss directly.
- `client/` is presentation — no domain rules, no client-side business filter/sort of collections.
- Schema change path: edit `app/models/schema.ts` → `npm run db:generate` → `npm run db:migrate`.

Growing a feature: [docs/agents/grow-a-feature.md](docs/agents/grow-a-feature.md). Frontend patterns: [docs/agents/frontend-patterns.md](docs/agents/frontend-patterns.md). Agent entrypoint: [AGENTS.md](./AGENTS.md).

## Layout

```
cmd/web           # Fastify + /api + @fastify/vite
cmd/worker        # pg-boss consumer
app/models        # domain + Drizzle / Better Auth
app/services      # cross-model (e.g. enqueue)
app/controllers   # thin /api HTTP
app/jobs          # thin worker adapters
db/migrate        # Drizzle migrations (generate + migrate)
docker/init       # compose first-boot SQL (CREATE EXTENSION vector)
client/pages      # route modules (getData + UI)
client/components # design system (ui / layout / shell / motion / screen)
client/styles     # Tailwind v4 + tweakcn theme (globals.css)
```

### Design system

- **Tailwind CSS v4** via `@tailwindcss/vite`, tokens from **tweakcn** in `client/styles/globals.css`
- **shadcn/coss-style** primitives under `client/components/ui` (`@base-ui/react` + CVA)
- Folders: `ui`, `layout`, `shell`, `motion-primitives`, `core`, `screen` (+ `icons.tsx`)
- `components.json` for adding more shadcn components; import alias `@/*` → `client/*`

## Setup

```bash
cp .env.example .env
npm install

npm run db:up          # pulls pgvector/pgvector:pg18 and starts it
npm run db:migrate

npm run dev            # http://localhost:3000
npm run worker         # other terminal
```

Stop DB: `npm run db:down`

## Database

- Compose uses **`pgvector/pgvector:pg18`** — Postgres 18 with [pgvector](https://github.com/pgvector/pgvector) already installed ([Docker Hub](https://hub.docker.com/r/pgvector/pgvector)).
- Stock **`postgres:18`** images do not include `vector`.
- Schema changes: edit `app/models/schema.ts` → `npm run db:generate` → `npm run db:migrate` (Drizzle migrator; tracks `__drizzle_migrations`).
- `CREATE EXTENSION vector` lives in the initial migration; compose also runs `docker/init/01-vector.sql` on first volume boot.
- Default URL: `postgres://kit:kit@localhost:5432/starter_kit`
- Fresh local DB: `docker compose down -v` → `npm run db:up` → `npm run db:migrate`.

## Deploy

Preferred path: **`docker-compose.prod.yml`** — nginx + web + worker. **Postgres is not included**; point `DATABASE_URL` at a cloud DB (Neon, Supabase, RDS, etc.) with **pgvector** enabled (or permission to `CREATE EXTENSION vector`).

```bash
cp .env.production.example .env.production
# edit DATABASE_URL + APP_URL (public URL users hit, e.g. http://localhost or https://app.example.com)

docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

Open `http://localhost` (or `HOST_PORT` from `.env.production`). Stop with:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production down
```

| Service    | Role                                                 |
| ---------- | ---------------------------------------------------- |
| **nginx**  | Reverse proxy on port 80 (override with `HOST_PORT`) |
| **web**    | Fastify + `@fastify/react` (migrates on boot)        |
| **worker** | pg-boss consumer                                     |

TLS: terminate at your cloud load balancer / Caddy in front of this compose, or extend `docker/nginx/` later. Not aimed at Vercel-style serverless.

### Environment (`.env.production`)

| Variable       | Purpose                                                     |
| -------------- | ----------------------------------------------------------- |
| `DATABASE_URL` | Cloud Postgres URL (ssl usually required)                   |
| `APP_URL`      | Public origin matching nginx (Better Auth `trustedOrigins`) |
| `HOST_PORT`    | Host port mapped to nginx `80` (default `80`)               |

### Manual / platform deploy (no Compose)

```bash
npm ci
npm run db:migrate
npm run build
NODE_ENV=production npm start
NODE_ENV=production npm run start:worker
```

### Checklist

- [ ] Cloud Postgres with **pgvector**
- [ ] `.env.production` set (`DATABASE_URL`, `APP_URL`)
- [ ] `docker compose … up -d --build` (or equivalent platform processes)
- [ ] Swap magic-link `console.log` for real email before real users

## Notes

- Magic links print to the **web** process console in development.
- Pages via `@fastify/vite` + `@fastify/react` (`client/pages`); JSON under `/api/auth/*` and `/api/jobs`. Job list live-updates by polling `GET /api/jobs`.
