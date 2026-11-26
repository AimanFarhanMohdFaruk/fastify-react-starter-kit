<a id="readme-top"></a>

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]



<div align="center">
  <h1 align="center">Fastify React starter</h1>
  <p align="center">
    A lightweight full-stack Fastify kit that grows without sacrificing comprehension. Grow your repo using agents with confidence.
    <br />
    MVC-shaped Node: Fastify owns HTTP, React SSR is a plugin (not the product), and domain lives in fat models — not in the frontend. Built as an alternative to defaulting every app to <strong>Next.js</strong>: you keep React and SSR, without App Router, RSC, or a framework that reinvents itself.
    <br />
    <br />
    <a href="docs/architecture.md"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="#getting-started">Getting started</a>
    ·
    <a href="https://github.com/AimanFarhanMohdFaruk/fastify-react-starter-kit/issues/new?labels=bug">Report Bug</a>
    ·
    <a href="https://github.com/AimanFarhanMohdFaruk/fastify-react-starter-kit/issues/new?labels=enhancement">Request Feature</a>
  </p>
</div>



<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#why-this-exists">Why this exists</a></li>
        <li><a href="#inspirations">Inspirations</a></li>
        <li><a href="#approach-mvc">Approach (MVC)</a></li>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#deploy">Deploy</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>



## About The Project

**Stack:** Fastify · [`@fastify/react`](https://vite.fastify.dev/react/) (Vite SSR) · Drizzle · Better Auth · pg-boss · **Postgres 18 + pgvector** · **Redis** · **RustFS** (S3-compatible object store via Docker) · **Inbucket** (local SMTP)

Agent entrypoint: [AGENTS.md](./AGENTS.md). Architecture: [docs/architecture.md](docs/architecture.md). Growing a feature: [docs/agents/grow-a-feature.md](docs/agents/grow-a-feature.md). Frontend: [docs/agents/frontend-patterns.md](docs/agents/frontend-patterns.md). Testing: [docs/testing.md](docs/testing.md).

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Why this exists

Next.js is a fine default for UI-first products and platform deploy. It is a poor default when you want:

- A real **server** you control (routes, cookies, workers, long-running jobs)
- **Stable seams** that look like Rails MVC, not framework file conventions
- Less time chasing breaking changes in how SSR / caching / data fetching “should” work this quarter

This kit bets on boring Node: **one web process + one worker**, Postgres as the source of truth, React as presentation.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Inspirations

Borrowed shapes, not cargo-cult copies. The kit is Node/Fastify; these are the mental models.

| Borrowed from | What we took | Where it shows up |
| ------------- | ------------ | ----------------- |
| **Go** (`cmd/` + `internal`/`pkg` mindset) | Process entries are programs, not framework folders | `cmd/web`, `cmd/worker` — web vs worker are separate binaries |
| **Rails** MVC | Fat models, thin controllers, views stay dumb | `app/models/`, `app/controllers/`, `client/pages` + `screen/` |
| **Sidekiq** | Queue is a stupid bus — delivery state ≠ domain | `app/queue/` + pg-boss adapter; no job row required to enqueue |
| **[`@fastify/react`](https://vite.fastify.dev/react/)** | React SSR as a **plugin**, not the product | Vite SSR after `/api`; pages are route modules |
| **Better Auth** | First-party sessions + admin role plugin | `app/models/auth`, `/api/auth/*`, `isAdmin` / `gatePage` |
| **Drizzle + Postgres** | Schema-as-code, boring SQL | `app/models/schema.ts` → `db/migrate/` |
| **Weekly `_kit_template`** | Same MVC seams on a lighter Worker/D1 host | Graduate path: idea → this kit without a rewrite |

Explicitly **not** borrowed: Next App Router / RSC conventions, framework-owned data cache, embedding the job consumer inside the web process.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Approach (MVC)

| Idea             | What it controls                                                                          |
| ---------------- | ----------------------------------------------------------------------------------------- |
| Fat models       | `app/models/` — schema, invariants, queries                                               |
| Thin controllers | `app/controllers/<resource>/` — `/api` via `index` + `handlers` + `dto`                   |
| Page loaders     | `app/controllers/<area>/loaders.ts` — gate + query + `*Dto` for SSR `getData`             |
| Views            | `client/pages/` — thin `getData` (one loader import) + screen                             |
| Queue            | `app/queue/` — stupid bus: `handlers`, typed `enqueue`, adapters, `registerWorkers`       |
| Services         | `app/services/` — cross-model, job bodies, upload policy                                  |

**Rules of the road**

- Models never import `controllers/`, `queue`, or `client/`.
- API controllers: folder per resource (`index` + `handlers` + `dto`); register via `composeWebApp` in `app/config.ts`; `requireSession` on private `/api`; one `*Dto` shared with page loaders.
- Page `getData`: one dynamic `import` of `load*Page` from `loaders.ts` — do not multi-import `@app` or hand-map DTOs in the page.
- Page loaders return JSON only (`{ redirectTo }` + client `pageRedirect` / `<Navigate>`); never `reply.redirect` in `getData` / `gatePage` (breaks `/-/data/*`).
- Queue is not tied to a domain table — `enqueue(name, args)` only; job bodies live in services.
- Controllers stay thin — no Drizzle / S3 / pg-boss directly (except the intentional `enqueue` call).
- `client/` is presentation — no domain rules, no client-side business filter/sort; Admin via `isAdmin`, never `role === 'admin'`.
- Schema change path: edit `app/models/schema.ts` → `npm run db:generate` → `npm run db:migrate`.
- Full grow path: [docs/agents/grow-a-feature.md](docs/agents/grow-a-feature.md).

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Built With

* [![Fastify][Fastify.js]][Fastify-url]
* [![React][React.js]][React-url]
* [![Vite][Vite.js]][Vite-url]
* [![TypeScript][TypeScript.js]][TypeScript-url]
* [![Drizzle][Drizzle.js]][Drizzle-url]
* [![Postgres][Postgres.js]][Postgres-url]
* [![Redis][Redis.js]][Redis-url]
* [![Tailwind CSS][Tailwind.css]][Tailwind-url]
* [![Oxlint][Oxlint.js]][Oxlint-url]

Plus: Better Auth · pg-boss · RustFS (S3) · Inbucket · Playwright · Testcontainers

<p align="right">(<a href="#readme-top">back to top</a>)</p>



## Getting Started

To get a local copy up and running, follow these steps.

### Prerequisites

* Node.js (current LTS recommended) and npm
* Docker (Compose) for Postgres, Redis, RustFS, and Inbucket

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/AimanFarhanMohdFaruk/fastify-react-starter-kit.git
   cd fastify-react-starter-kit
   ```
2. Copy env and install packages
   ```sh
   cp .env.example .env
   npm install
   ```
3. Start infra, migrate, verify
   ```sh
   npm run db:up          # pgvector/pgvector:pg18
   npm run redis:up       # optional; also started by npm run dev
   npm run db:migrate
   npm run lint           # Oxlint (correctness + React)
   npm run typecheck
   ```
4. Run web + worker
   ```sh
   npm run dev:all        # compose + web + worker → http://localhost:3000
   # npm run worker       # other terminal, if not using dev:all
   ```

Magic-link mail: with `MAIL_TRANSPORT=smtp` (default in `.env.example`), open **http://localhost:8025** (Inbucket) after requesting a link.

Promote an Admin after migrate:

1. Sign up at `/login`
2. `npm run admin:promote -- you@example.com`
3. Sign in, open `/admin` (JSON `{ redirectTo }` → `/admin/users`)

Stop compose services: `npm run db:down`

<p align="right">(<a href="#readme-top">back to top</a>)</p>



## Usage

### Layout

```
cmd/
  web/main.ts           # composeWebApp({ vite }) + listen
  worker/main.ts        # calls registerWorkers()
app/
  config.ts                   # composeWebApp — plugins + register*Routes + optional Vite
  controllers/
    auth.ts                   # Better Auth mount + session helpers
    posts/ · documents/ · work/   # /api — {index,handlers,dto}
    admin/ · dashboard/ · home/ · login/   # SSR — loaders.ts (+ admin/dto)
  models/                     # fat domain (no controllers/queue/client)
  services/                   # shout, upload-document, parse-document
  queue/                       # handlers + enqueue + adapters (pg-boss / inline) + registerWorkers
  db.ts · redis.ts · mail.ts · object-store.ts
db/migrate                    # Drizzle migrations
docker/init                   # compose first-boot SQL (CREATE EXTENSION vector)
client/
  pages/                      # route modules — getData → one load*Page import
  components/                 # design system (ui / layout / shell / motion / screen)
  styles/                     # Tailwind v4 + tweakcn theme (globals.css)
```

### Design system

- **Tailwind CSS v4** via `@tailwindcss/vite`, tokens from **tweakcn** in `client/styles/globals.css`
- **shadcn/coss-style** primitives under `client/components/ui` (`@base-ui/react` + CVA)
- Folders: `ui`, `layout`, `shell`, `motion-primitives`, `core`, `screen` (+ `icons.tsx`)
- `components.json` for adding more shadcn components; import alias `@/*` → `client/*`

### Database

- Compose uses **`pgvector/pgvector:pg18`** — Postgres 18 with [pgvector](https://github.com/pgvector/pgvector) already installed ([Docker Hub](https://hub.docker.com/r/pgvector/pgvector)).
- Stock **`postgres:18`** images do not include `vector`.
- Schema changes: edit `app/models/schema.ts` → `npm run db:generate` → `npm run db:migrate` (Drizzle migrator; tracks `__drizzle_migrations`).
- `CREATE EXTENSION vector` lives in the initial migration; compose also runs `docker/init/01-vector.sql` on first volume boot.
- Default URL: `postgres://kit:kit@localhost:5432/starter_kit`
- Fresh local DB: `docker compose down -v` → `npm run db:up` → `npm run db:migrate`.

### Redis

- Compose service **`redis:7-alpine`** on `localhost:6379` (AOF persistence in `kit_redis_data`).
- Default URL: `redis://localhost:6379` (`REDIS_URL` in `.env`).
- App client: `app/redis.ts` — `import { getRedis } from './redis'` (lazy connect, one client per process).
- Start alone: `npm run redis:up`. Logs: `npm run redis:logs`.
- `npm run dev` / `docker compose up -d` starts Redis with the other local services.
- Not included in `docker-compose.prod.yml` — point `REDIS_URL` at a managed Redis when you need it in prod.

### Object store (RustFS)

- Compose runs **RustFS** (S3-compatible) on `:9000` (API) and `:9001` (console).
- `npm run dev` / `npm run dev:all` start compose services (Postgres + Redis + RustFS + Inbucket) before the web process.
- App env: `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET` (see `.env.example`).
- Uploads: `POST /api/documents` (multipart `.md` / `.txt` / `.pdf`, max 5MB); bytes in the bucket, metadata in `documents`.

### Email

- App client: `app/mail.ts` — `getMailer().send(...)` (infra, like object-store). Magic-link copy in `app/mail/templates/`.
- **Local:** Compose **Inbucket** — SMTP `localhost:2500`, web UI **http://localhost:8025** (port remapped; RustFS owns `:9000`).
- Env: `MAIL_TRANSPORT=smtp|resend|log`, `MAIL_FROM`, plus `SMTP_*` or `RESEND_API_KEY` (see `.env.example`).
- **Prod:** `MAIL_TRANSPORT=resend` and a verified `MAIL_FROM` / `RESEND_API_KEY`.

### Notes

- Local magic links land in **Inbucket** (`http://localhost:8025`) when `MAIL_TRANSPORT=smtp`. Use `MAIL_TRANSPORT=log` to print to the web console instead.
- Pages via `@fastify/vite` + `@fastify/react` (`client/pages`); JSON under `/api/auth/*`, `/api/posts` (CRUD), `/api/work` (enqueue), `/api/documents`.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



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

| Variable               | Purpose                                                     |
| ---------------------- | ----------------------------------------------------------- |
| `DATABASE_URL`         | Cloud Postgres URL (ssl usually required)                   |
| `APP_URL`              | Public origin matching nginx (Better Auth `trustedOrigins`) |
| `HOST_PORT`            | Host port mapped to nginx `80` (default `80`)               |
| `BETTER_AUTH_URL`      | Auth base URL (defaults to `APP_URL` in compose)            |
| `BETTER_AUTH_SECRET`   | Better Auth secret (required in production)                 |
| `S3_*`                 | Object store for document uploads                           |
| `MAIL_TRANSPORT`       | `resend` (or `log` / `smtp`)                                |
| `MAIL_FROM`            | Verified sender for Resend                                  |
| `RESEND_API_KEY`       | Resend API key when `MAIL_TRANSPORT=resend`                 |

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
- [ ] Set `MAIL_TRANSPORT=resend`, `MAIL_FROM`, and `RESEND_API_KEY` before real users

<p align="right">(<a href="#readme-top">back to top</a>)</p>



## Roadmap

- [x] Page gate + typed domain errors + queue adapters
- [x] Client `request` / `ApiError` core
- [x] JSON `{ redirectTo }` for soft nav (no `reply.redirect` in loaders)
- [x] Oxlint (correctness + React)
- [ ] ObjectStore in-memory adapter (delete copy-pasted test fakes)
- [ ] Document kind table (MIME / accept / extract / status in one place)
- [ ] Auth `createAuth` factory (harness stops duplicating Better Auth config)
- [ ] Infra lifecycle (lazy create / override / close for db · mail · object-store)

See the [open issues](https://github.com/AimanFarhanMohdFaruk/fastify-react-starter-kit/issues) for a full list of proposed features (and known issues).

<p align="right">(<a href="#readme-top">back to top</a>)</p>



## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Before opening a PR: `npm run lint`, `npm run typecheck`, and relevant `npm test` / e2e.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



## License

No license file is published in this repository yet. Clarify before redistributing.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



## Contact

Aiman Farhan — [GitHub](https://github.com/AimanFarhanMohdFaruk)

Project Link: [https://github.com/AimanFarhanMohdFaruk/fastify-react-starter-kit](https://github.com/AimanFarhanMohdFaruk/fastify-react-starter-kit)

<p align="right">(<a href="#readme-top">back to top</a>)</p>



## Acknowledgments

* [Best-README-Template](https://github.com/othneildrew/Best-README-Template)
* [Fastify](https://fastify.dev/) · [@fastify/react](https://vite.fastify.dev/react/)
* [Better Auth](https://www.better-auth.com/) · [Drizzle](https://orm.drizzle.team/) · [pg-boss](https://github.com/timgit/pg-boss)
* [Oxlint](https://oxc.rs/docs/guide/usage/linter.html) · [tweakcn](https://tweakcn.com/) · [shadcn/ui](https://ui.shadcn.com/)

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- MARKDOWN LINKS & IMAGES -->
[contributors-shield]: https://img.shields.io/github/contributors/AimanFarhanMohdFaruk/fastify-react-starter-kit.svg?style=for-the-badge
[contributors-url]: https://github.com/AimanFarhanMohdFaruk/fastify-react-starter-kit/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/AimanFarhanMohdFaruk/fastify-react-starter-kit.svg?style=for-the-badge
[forks-url]: https://github.com/AimanFarhanMohdFaruk/fastify-react-starter-kit/network/members
[stars-shield]: https://img.shields.io/github/stars/AimanFarhanMohdFaruk/fastify-react-starter-kit.svg?style=for-the-badge
[stars-url]: https://github.com/AimanFarhanMohdFaruk/fastify-react-starter-kit/stargazers
[issues-shield]: https://img.shields.io/github/issues/AimanFarhanMohdFaruk/fastify-react-starter-kit.svg?style=for-the-badge
[issues-url]: https://github.com/AimanFarhanMohdFaruk/fastify-react-starter-kit/issues

[Fastify.js]: https://img.shields.io/badge/Fastify-000000?style=for-the-badge&logo=fastify&logoColor=white
[Fastify-url]: https://fastify.dev/
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://react.dev/
[Vite.js]: https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white
[Vite-url]: https://vite.dev/
[TypeScript.js]: https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white
[TypeScript-url]: https://www.typescriptlang.org/
[Drizzle.js]: https://img.shields.io/badge/Drizzle-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black
[Drizzle-url]: https://orm.drizzle.team/
[Postgres.js]: https://img.shields.io/badge/Postgres-4169E1?style=for-the-badge&logo=postgresql&logoColor=white
[Postgres-url]: https://www.postgresql.org/
[Redis.js]: https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white
[Redis-url]: https://redis.io/
[Tailwind.css]: https://img.shields.io/badge/Tailwind-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white
[Tailwind-url]: https://tailwindcss.com/
[Oxlint.js]: https://img.shields.io/badge/Oxlint-2C2255?style=for-the-badge&logo=oxc&logoColor=white
[Oxlint-url]: https://oxc.rs/docs/guide/usage/linter.html
