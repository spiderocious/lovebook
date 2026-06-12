# Running the workspace

The workspace is a pnpm + Nx monorepo. Every app lives under `apps/`; every shared library lives under `packages/`. Use `pnpm` for everything — `npm` and `yarn` are blocked by the root `preinstall` hook.

## Prerequisites

- Node.js **>= 20**
- pnpm **>= 9.15** (`brew install pnpm` or `corepack enable && corepack prepare pnpm@9.15.9 --activate`)
- Ports free locally: **8081** (main-backend), **5173** (web), **5174** (admin-web), **3000** (website), **4173/4174** (vite preview)

## First-time setup

```bash
pnpm install                                      # workspace install (root)
cp apps/main-backend/.env.example  apps/main-backend/.env
cp apps/web/.env.example           apps/web/.env
cp apps/admin-web/.env.example     apps/admin-web/.env
cp apps/website/.env.example       apps/website/.env
```

Set real secrets in every `.env` before running in any non-local environment. JWT secrets must be ≥ 32 chars.

## Apps overview

| App            | Stack      | Dev port | Prod cmd               | Notes                          |
| -------------- | ---------- | -------- | ---------------------- | ------------------------------ |
| `main-backend` | Express    | 8081     | `pnpm start`           | Public HTTP API (`/api/v1/*`)  |
| `web`          | Vite/React | 5173     | `pnpm start` (preview) | End-user app                   |
| `admin-web`    | Vite/React | 5174     | `pnpm start` (preview) | Operations console             |
| `website`      | Next.js    | 3000     | `pnpm start`           | Marketing / public website     |

## Running one app

Either use the per-app filter or `cd` into the app:

```bash
# Filter form (run from anywhere)
pnpm -F @lovebook/main-backend dev
pnpm -F @lovebook/web dev
pnpm -F @lovebook/admin-web dev
pnpm -F @lovebook/website dev

# Or via Nx target name (project name = unscoped, e.g. `web`)
pnpm exec nx run main-backend:dev
pnpm exec nx run web:dev
```

### Typical local stack

In separate terminals:

```bash
pnpm -F @lovebook/main-backend dev        # 8081
pnpm -F @lovebook/web dev                 # 5173 → calls main-backend
pnpm -F @lovebook/website dev             # 3000 → links to web
```

## Building

Each app has a `build` target that produces a `dist/` (or `.next/` for the website). pnpm dependency graph + Nx caching mean shared packages build automatically when an app needs them.

```bash
# One app
pnpm -F @lovebook/main-backend build
pnpm -F @lovebook/web build

# Everything (Nx orchestrates the dependency order: core → api/ui → apps)
pnpm exec nx run-many -t build
# or
pnpm build
```

Output locations:

- `apps/main-backend/dist/` — compiled JS (run with `node dist/server.js`)
- `apps/web/dist/` — static assets (serve any way you like; `pnpm start` runs `vite preview`)
- `apps/admin-web/dist/` — same as web
- `apps/website/.next/` — Next.js production build (run with `pnpm start`)

## Running production builds locally

```bash
# Express service
pnpm -F @lovebook/main-backend build && pnpm -F @lovebook/main-backend start

# Vite preview (production bundle on a preview server, port 4173/4174)
pnpm -F @lovebook/web build && pnpm -F @lovebook/web start
pnpm -F @lovebook/admin-web build && pnpm -F @lovebook/admin-web start

# Next.js production
pnpm -F @lovebook/website build && pnpm -F @lovebook/website start
```

## Typecheck & lint

```bash
# Single project
pnpm -F @lovebook/main-backend typecheck
pnpm -F @lovebook/web lint

# All projects
pnpm typecheck       # nx run-many -t typecheck
pnpm lint            # nx run-many -t lint
pnpm build           # nx run-many -t build
```

Nx caches results — subsequent runs without source changes finish in seconds.

## Health check

```bash
curl http://localhost:8081/api/v1/health           # main-backend
```

## Troubleshooting

- `Invalid environment variables` on boot — copy the matching `.env.example` and set every required value (zod parse error lists the missing keys).
- `EADDRINUSE` — a previous dev process is still running on the port. `lsof -ti:<port> | xargs kill -9`.
- `Module not found: '@lovebook/ui'` after a rename — restart the dev server; tsconfig path edits aren't watched.
- `npm install` errors out — the `preinstall` hook blocks anything other than pnpm. Install pnpm or use corepack.
