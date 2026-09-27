# Fastify React starter

Implements [STACK.md](../STACK.md) and [architecture-conventions.md](../docs/personal-starter-kit-stack/architecture-conventions.md).

**Stack:** Fastify · `@fastify/react` · Drizzle · Better Auth · pg-boss · **Postgres 18 + pgvector** (Docker)

## Agents

[AGENTS.md](./AGENTS.md) — how to grow features (model → service → controller → job → page) and frontend patterns. Agent-agnostic; `CLAUDE.md` points here.

## Layout

```
cmd/web          # Fastify + /api + @fastify/vite
cmd/worker       # pg-boss consumer
app/models       # domain + Drizzle / Better Auth
app/services     # cross-model (enqueue)
app/controllers  # thin /api HTTP
app/jobs         # thin worker adapters
db/migrate       # SQL
docker/init      # first-boot SQL (CREATE EXTENSION vector)
client/pages     # @fastify/react route modules (getData + UI)
client/components # design system (ui / layout / shell / motion / screen)
client/styles    # Tailwind v4 + tweakcn theme (globals.css)
```

### Design system

Same approach as `payload-better-auth-starter`:

- **Tailwind CSS v4** via `@tailwindcss/vite`, tokens from **tweakcn** in `client/styles/globals.css`
- **shadcn/coss-style** primitives under `client/components/ui` (`@base-ui/react` + CVA)
- Folders: `ui`, `layout`, `shell`, `motion-primitives`, `core`, `screen` (+ `icons.tsx`)
- `components.json` for adding more shadcn components; import alias `@/*` → `client/*`

## Setup

```bash
cd kit
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
- First boot runs `docker/init/01-vector.sql` (`CREATE EXTENSION vector`).
- Default URL: `postgres://kit:kit@localhost:5432/starter_kit`

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

| Service    | Role                                      |
| ---------- | ----------------------------------------- |
| **nginx**  | Reverse proxy on port 80 (override with `HOST_PORT`) |
| **web**    | Fastify + `@fastify/react` (migrates on boot)  |
| **worker** | pg-boss consumer                          |

TLS: terminate at your cloud load balancer / Caddy in front of this compose, or extend `docker/nginx/` later. Not a fit for Vercel-style serverless.

### Environment (`.env.production`)

| Variable       | Purpose                                                                 |
| -------------- | ----------------------------------------------------------------------- |
| `DATABASE_URL` | Cloud Postgres URL (ssl usually required)                               |
| `APP_URL`      | Public origin matching nginx (Better Auth `trustedOrigins`)             |
| `HOST_PORT`    | Host port mapped to nginx `80` (default `80`)                           |

### Manual / platform deploy (no Compose)

Same shape without the Compose file: run **web** + **worker** against cloud Postgres, put a reverse proxy in front.

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
