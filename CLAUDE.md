# Monorepo Template

This is a **reusable starter template**, not a finished product. The wiring is
real; the names and content are deliberately generic placeholders. See
[README.md](README.md) for the tour and [docs/rules.md](docs/rules.md) for the
code conventions (read `rules.md` before adding code).

## ⚠️ First thing — if this is a fresh project, ask before building

If a developer asks you to start building features and the repo still looks like
the untouched template (package scope is still `@lovebook/*`, root package name is
still `monorepo-template`, the `example` feature still exists), **stop and ask
two questions before writing any feature code**:

1. **What's the product/app name?** Then either:
   - Rebrand to it — e.g. rename the package scope `@lovebook/*` → `@<name>/*` and set
     the root `package.json` `name` to the product name. See "How to rebrand" below.
   - Or keep `@lovebook` as-is if they prefer a neutral scope. Either is fine — just
     confirm rather than assuming.
2. **What should happen to the placeholders?** The `example` feature, the stub
   `User`/`ExampleItem` types, and the placeholder home/website copy exist only to
   demonstrate the wiring. Confirm whether to replace them now, leave them as a
   reference, or delete them.

Do **not** silently invent a name or scatter a product name through the code
without asking. A wrong guess is expensive to undo across a monorepo.

## How to rebrand (`@lovebook` → `@<product>`)

The scope `@lovebook` appears in a fixed set of places. To rename it, change all of:

- **Package names** — `name` field in every `apps/*/package.json` and
  `packages/*/package.json` (`@lovebook/web`, `@lovebook/core`, …).
- **Workspace dependency references** — `"@lovebook/core": "workspace:*"` etc. in the
  apps that consume shared packages.
- **TS path aliases** — `tsconfig.base.json` (`@lovebook/ui`, `@lovebook/core`, `@lovebook/api`).
- **Vite aliases** — `apps/web/vite.config.ts` and `apps/admin-web/vite.config.ts`
  (note: these use regex forms like `/^@lovebook\/ui$/`, so update those too).
- **Source imports** — `import { … } from '@lovebook/...'` across `apps/` and `packages/`.
- **Root package name** — `name` in the top-level `package.json`.
- **Docs** — `README.md`, `docs/rules.md`, `docs/run.md` mention `@lovebook/*` in commands.

After renaming, run `pnpm install` (refreshes `pnpm-lock.yaml` with the new
names), then verify with `pnpm exec nx run-many -t typecheck` and
`... -t build`. The per-app `src` aliases (`@app`, `@features`, `@shared`,
`@lib`, `@middlewares`, `@icons`) are internal and stay as they are — only the
cross-package `@lovebook` scope changes.

## What's a placeholder (safe to replace/delete)

- `example` feature: `apps/main-backend/src/features/example/`,
  `apps/web/src/features/example/`, plus `ROUTES.EXAMPLE*` in
  `packages/core/src/constants/routes.ts` and `EP.EXAMPLE*` in
  `packages/api/src/endpoints.ts`.
- Stub types `User` / `ExampleItem` in `packages/core/src/types/index.ts`.
- Home/website copy and `<title>` tags; design tokens in
  `packages/ui/src/theme/index.ts` (mirror any change into each
  `tailwind.config.ts` and `packages/ui/src/styles.css`).

The `auth` and `health` backend features, the request/envelope/error
middleware, the typed `api` client, and the `ui` primitives are reusable
scaffolding — keep and build on them.

## Conventions (summary — full version in docs/rules.md)

- **pnpm only** (enforced by the `preinstall` hook). Run tasks through Nx.
- Strict TypeScript; `any` is banned. Backends use NodeNext (`.js` import
  specifiers); frontends use Bundler resolution.
- Backend features follow `feature.routes.ts` / `feature.schema.ts` with a
  single `register(app)` per `features/<name>/index.ts`. Responses go through
  `ResponseUtil`; errors bubble to the central handler.
- Frontend data fetching is react-query only, hitting `EP.*` constants; routes
  come from `ROUTES.*`; UI comes from `@lovebook/ui`; icons from `@icons`.
- Package dependency direction: `core` ← `api`, `core` ← `ui`. No `ui → api`.

---

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->
