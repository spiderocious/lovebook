# Monorepo Template

A starter monorepo for quickly spinning up a new project. Nx + pnpm workspace
with a shared core/api/ui layer, an Express backend, two React frontends and a
Next.js marketing site. Strict TypeScript, ESLint/Prettier, and a typed
request/response envelope are wired up out of the box.

## What's in here

```
apps/
  main-backend/   Express, public HTTP API (/api/v1/*)
  web/            Vite/React, end-user app
  admin-web/      Vite/React, operations console
  website/        Next.js, marketing site
packages/
  core/           Pure TS — types, routes, helpers (no React, no Node-only APIs)
  api/            Network client (ky), endpoint constants, react-query hooks
  ui/             React + Tailwind primitives + design tokens
docs/
  rules.md        Workspace & code conventions — read this first
  run.md          How to run, build, typecheck, lint
```

## Quick start

```bash
pnpm install
cp apps/main-backend/.env.example apps/main-backend/.env
cp apps/web/.env.example          apps/web/.env
cp apps/admin-web/.env.example    apps/admin-web/.env
cp apps/website/.env.example      apps/website/.env

# In separate terminals
pnpm -F @lovebook/main-backend dev    # http://localhost:9092
pnpm -F @lovebook/web dev             # http://localhost:5173
```

Full commands (build, production, per-app filters) are in [docs/run.md](docs/run.md).

## Using this as a template

This repo is deliberately generic. The wiring is real; the content is
placeholder. To make it yours:

1. **Rename the package scope.** It's `@lovebook/*` everywhere — package names,
   `tsconfig.base.json` paths, each app's `vite.config.ts` aliases. Pick your
   own scope and find-and-replace `@lovebook` across the workspace, then update the
   root package `name` in `package.json`.
2. **Re-theme.** Edit the design tokens in
   [packages/ui/src/theme/index.ts](packages/ui/src/theme/index.ts) and mirror
   them in each app's `tailwind.config.ts` and
   [packages/ui/src/styles.css](packages/ui/src/styles.css). The token names
   (`brand`, `surface`, `accent`, `ink`) are semantic so they survive a rebrand.
3. **Replace the `example` feature.** There's a placeholder feature that
   demonstrates the full path — route constant (`ROUTES.EXAMPLE`), endpoint
   (`EP.EXAMPLE_LIST`), backend router (`apps/main-backend/src/features/example/`),
   and screen (`apps/web/src/features/example/`). Delete it and build your own
   following the same shape.
4. **Replace placeholder types.** [packages/core/src/types/index.ts](packages/core/src/types/index.ts)
   has stub `User` / `ExampleItem` types. Swap in your domain.
5. **Update copy & metadata.** Home screens, the website page/layout metadata,
   and the `<title>` tags in each `index.html`.

## Conventions

Read [docs/rules.md](docs/rules.md) before adding code — it covers the package
dependency rules, the backend feature/envelope/error pattern, the frontend
data-fetching pattern, naming, and the strict-TypeScript settings.

## Tooling

- **pnpm** is enforced (`preinstall` hook blocks npm/yarn).
- **`.npmrc`** sets `minimum-release-age=10080` — pnpm refuses any dependency
  version published in the last 7 days, a cheap defence against fresh
  supply-chain attacks.
- **Nx** orchestrates builds in dependency order with caching. Prefer
  `nx run` / `nx run-many` / `nx affected` over the underlying tooling.
