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

**Phases 2–7 are DONE (2026-06-13).** The whole frontend PWA is built in apps/web on the Phase-1 API: auth (landing/login/register + AuthProvider + token wiring + 4 route guards), pairing (invite/claim/leave + deep-link receiver flow + past pairs), feed (infinite cursor scroll, optimistic text posts, offline IndexedDB outbox that flushes on reconnect), photo (camera capture) + voice (MediaRecorder, 30s cap) posts through the media upload→gate flow, reactions (tap=❤️ / long-press picker using CORE REACTIONS set, optimistic), and settings (name, quiet hours w/ resolved IANA tz, push opt-in via SW pushManager, leave pair, delete account). All screens lazy-loaded; meemaw Show/Repeat/Loadable everywhere (no &&/.map in JSX); react-query hooks hit EP.*; UI from @lovebook/ui. Frontend QA handoff at docs/qas/frontend-qa-handoff.md. typecheck 7/7 + lint + web build + backend 90/90 tests all green.

Frontend gotcha learned: this eslint config has NO react-hooks plugin — don't write `// eslint-disable react-hooks/exhaustive-deps` (it errors as unknown-rule). Also apps/web must NOT import `ky` directly (not its dep; ky lives in @lovebook/api) — use a local options type in shared/api/unwrap.ts.

Not yet built (deferred, noted in handoff): avatar-upload UI, real voice waveform peaks. Residual backend risks still open: rate-limiting on /auth/login, token revocation on logout.

See [[lovebook-product]] for the product + stack summary.
