---
name: lovebook-plan-docs
description: Where the lovebook planning docs live in the repo
metadata:
  type: reference
---

lovebook docs (in the repo, written 2026-06-13):
- `docs/lovebook-plan.md` — detailed architecture/data-model/endpoint-contract plan.
- `docs/product/phases.md` — ordered build phases (modeled on shirtify). Backend built once & complete in Phase 1; frontend progressive (Phases 2+). PWA + offline + web push from the start. No year-in-review.
- `docs/api/api-reference.md` — full v1 API reference.
- `docs/qas/backend-qa-handoff.md` — backend QA handoff (endpoints, state machine, edge cases).
- `docs/qas/seam-contract.md` — backend↔frontend contract-drift checklist + the hooks Phase 2+ will build.

**Phases 0 + 1 are DONE and QA-cleared (2026-06-13).** Backend complete & contract-tested: all features built (auth, pairing w/ atomic lock, feed/posts, media gate, reactions, settings, push). PWA shell (vite-plugin-pwa SW + manifest + IndexedDB outbox) in apps/web.

QA (backend persona) ran 89 in-memory tests + a live replica-set race suite — report in `docs/qas/backend-execution-report.md`. Found + I FIXED two bugs: BUG-01 (invalid IANA tz accepted → now `.refine`d against Intl in core quietHoursSchema → 400) and BUG-02 (concurrent POST /pair/invite leaked a duplicate pending pair → now a partial-unique index on `{createdBy, status:'live'}` + createInvite yields to the race winner). All 89 tests green, typecheck/lint/build clean.

Two RESIDUAL RISKS carried to Phase 2 (not bugs): no rate-limiting on /auth/login; stateless logout doesn't revoke tokens (no denylist/token-version yet).

Two known runtime gotchas to remember: (1) mongoose is CJS — under NodeNext ESM the model files must `import mongoose from 'mongoose'` then destructure `{Schema, model, models}`, NOT named-import them (crashes the dev server though vitest masks it). (2) `apps/website` build is broken by a PRE-EXISTING template defect (Next server component importing the client-only @lovebook/ui barrel) — NOT my code, website out of v1 scope.

Next up: Phase 2 (frontend auth).

See [[lovebook-product]] for the product + stack summary.
