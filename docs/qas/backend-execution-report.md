# Backend QA Execution Report — lovebook (Phase 1, whole API)

**Date:** 2026-06-13
**Branch:** main
**Plan:** [backend-test-plan.md](./backend-test-plan.md)
**Build:** typecheck ✅ · lint ✅
**Surfaces run:** in-repo (vitest + supertest + mongodb-memory-server) **and** a
live single-node replica set (`mongod --replSet rs0`, port 27018) for the
atomic-lock race tests the in-memory server cannot model.

---

## Summary

| Surface | Passed | Failed | Notes |
|---------|:------:|:------:|-------|
| Baseline suite (pre-existing) | 28 | 0 | re-run, all green |
| New gap suite (`qa-gaps`, `qa-media-contract`) | 61 | 0 | auth negatives, settings, gate matrix, validation, media (stubbed), seam/contract, cross-cutting |
| **In-memory total** | **89** | **0** | `pnpm -F @lovebook/main-backend test` |
| Replica-set race (`race.manual.mjs`) | 5 | 2 | the 2 "failures" = **BUG-02** (concurrent invite) |

**Verdict:** the API is solid. Happy paths, auth lifecycle, the pair gate, the
media access-gate, and the full seam/contract all hold. The atomic pair-lock —
the single highest-risk surface — is **correct under real concurrency**
(SM-RACE-01 clean). Two bugs found, both low-blast-radius: one P2 (silent
quiet-hours misbehavior), one P3 (concurrent-invite leaves orphan pending state).

---

## Bugs found

### BUG-01 (P2) — Invalid IANA timezone is accepted and silently mishandled

**Where:** `packages/core/src/domain/schemas.ts:28` (`quietHours.tz: z.string().min(1)`)
→ `apps/main-backend/src/features/me/me.service.ts:19` (no server-side validation)
→ surfaces at `apps/main-backend/src/lib/push.ts:62` (`minutesInTz`).

**Observed:** `PATCH /me` with `quietHours.tz: "Not/Real"` returns **200** and
stores the bogus tz verbatim. The core schema's own comment promises tz is
*"validated against Intl on the server"* — that validation does not exist.

**Mechanism / impact:** at notification time, `minutesInTz` calls
`new Intl.DateTimeFormat(..., { timeZone: tz })`, which throws `RangeError` on an
invalid zone. A `try/catch` swallows it and **falls back to UTC**. So push
delivery never crashes, but a user who set quiet hours with a zone the server
mis-stores has their quiet window computed in **UTC instead of their zone** —
notifications arrive at the wrong times, silently. Expected: **400
`validation_error` + `field_errors.quietHours`**.

**Fix:** validate `tz` on the write path. Cheapest: in `quietHoursSchema`, refine
`tz` against `Intl.supportedValuesOf('timeZone')` (or a try/`Intl.DateTimeFormat`
probe in a `.refine`). One-line schema change; no migration needed.

**Test:** `qa-gaps.test.ts > ME-02b` — pinned to current (buggy) behavior with a
`BUG-01` comment so the suite stays green; flip the assertion to `400` when fixed.

### BUG-02 (P3) — Concurrent `POST /pair/invite` leaks a duplicate pending pair

**Where:** `apps/main-backend/src/features/pair/pair.service.ts:30-43`
(`createInvite`) + `apps/main-backend/src/models/invite.model.ts:24`
(unique partial index is on `code`, **not** on `createdBy`).

**Observed (replica set, SM-RACE-03):** two simultaneous invite calls from the
**same** user both return 201 and produce **two** pending pairs and **two** live
invite codes. Sequentially it's correct — re-invite is idempotent (PAIR-01
passes); the bug only appears under concurrency.

**Mechanism:** the "return the existing live invite" guard
(`findLiveInviteByCreator`) is a non-atomic read-then-write. Two requests both
read "no live invite" before either writes, so both mint. Nothing at the DB level
stops it — the partial-unique index keys on `code` (always distinct), not on the
creator.

**Impact — low:** the orphan pending pair + extra code expire on the 24h TTL, and
the **"at most one *active* pair" invariant is never violated** (the atomic claim
lock holds — see SM-RACE-01). It's untidy transient state, not a correctness
break. A user could also share whichever code; both resolve to a (different)
pending pair until one is claimed.

**Fix:** add a partial-unique index on `{ createdBy: 1 }` filtered to live invites
(or pending pairs), and let the existing 11000-retry path in `mintUniqueCode`
collapse the race — or do the read-and-insert in one `findOneAndUpdate` upsert.

**Test:** `race.manual.mjs > SM-RACE-03` (the 2 "FAIL" lines are this bug).

---

## Results by area

### Auth — negatives & token lifecycle (the biggest baseline gap) — all PASS
- No token / malformed header / garbage token / **expired token** / **wrong-secret
  JWT** / **refresh-token-used-as-access** → all `401` (AUTH-01…05b).
- Refresh issues new, *working* tokens (AUTH-07). Garbage refresh → 401 (AUTH-06).
- Boundaries: name 0/61 → 400; email format → 400; password 7 reject / 8 ok /
  200 ok / 201 reject (AUTH-08…10).
- Login unknown email → **401, not 404** (no account enumeration, AUTH-11).
- Logout 204 + token still valid after = **stateless JWT, documented** (AUTH-12, RISK).

### Settings (/me) — PASS (1 bug)
- avatarKey set→null, quietHours set→null round-trip correctly as `null`
  (nullable, not omitted). Bad time format → 400. No-auth → 401. Delete-with-no-pair
  → 204. **BUG-01** caught here (bogus tz accepted).

### Pair gate matrix — all PASS
- All 6 pair-gated routes: no token → 401; authed-but-unpaired → **403 `forbidden`**;
  paired → allowed.
- `push/subscribe` & `push/unsubscribe` correctly require auth (401) — confirms
  audit item SA-01 (the public `push/key` ordering does not leak the mutations).

### Feed / posts validation — all PASS
- Photo missing mediaKey → 400. Voice durationMs 0/30001 reject, 1/30000 accept.
  Unknown discriminated `type` → 400. Empty feed → `posts: []` / `nextCursor: null`
  / `hasMore: false`. Bogus cursor → 400 (not 500). limit 0/51 → 400.

### Media access-gate (file-service stubbed) — all PASS
- Own-pair photo → 200 `{uri, expiresIn}`. Text post (no media) → 404.
  Non-existent post → 404. **Cross-pair → 403** (gate holds). upload-uri valid
  → 200, path-traversal ext → 400. **File-service 5xx → mapped 502 envelope, no
  stack-trace leak** (confirms audit SA-04 + the degraded path).

### Reactions — all PASS
- All 6 emojis accepted; clear idempotent (204 twice); react to missing post → 404;
  missing emoji → 400 `field_errors.emoji`.

### Push — all PASS
- key public → `{key:null}` (VAPID unset); subscribe upserts by endpoint (no dup);
  bad endpoint → 400; unsubscribe unknown → 200 idempotent.

### Seam / contract (drift prevention) — all PASS
- `User`, `Post`, `FeedPage`, `Pair`, `Reaction`, auth-refresh DTOs all match the
  expected `@lovebook/core` shapes: exact key sets, nullable fields present as
  `null` (never omitted), dates ISO 8601, refresh shape `{access_token,
  refresh_token}` (the ky-client pin), pair-member shape `{id,name,avatarKey}`
  with **no email leak**.

### Cross-cutting invariants — all PASS
- No secret fields (`passwordHash`/`password`/`tokenVersion`/`__v`) in any
  response (X-03). IDs 24-hex. Error/success envelopes correct. Unknown route →
  404 envelope, not raw HTML. Dates ISO.

### Concurrency / atomic lock (replica set) — core PASS, BUG-02 noted
- **SM-RACE-01 (the critical one): PASS.** Two users claiming the same invite
  simultaneously → exactly one 200, the other 409, pair ends with exactly 2
  members, losing claimer left unpaired. `supportsTransactions()` confirmed
  `true`, so this exercised the **real transaction path** the in-memory suite
  cannot reach.
- **SM-RACE-03: FAIL → BUG-02** (concurrent invite duplicate, P3, above).

---

## What was NOT tested (out of scope / residual risk)

| Item | Why |
|------|-----|
| Frontend UI | None exists (Phase 2+). |
| Magic-link sign-in, year-in-review | Not built / cut. |
| Real web-push wire delivery | VAPID unset; only the subscribe/key/skip contract tested, not FCM delivery. |
| Quiet-hours **deferred** delivery | Current behavior drops while muted (documented); deferred queue is a later refinement. |
| TTL reaping firing on the clock | SM-05: verified the index design; Mongo's TTL monitor runs ~60s and is the DB's job, not asserted by wall-clock. |
| **Rate limiting** | **RISK:** no `429`/`Retry-After` path exists on `/auth/login`. Brute-force is unbounded this phase — flag for Phase 2. |
| **Stateless logout** | **RISK:** logout does not revoke; access token valid until expiry (AUTH-12). Consider token-version/denylist in Phase 2. |

---

## Fix status (2026-06-13, post-QA)

Both bugs fixed and verified — full suite now **89/89** green.

- **BUG-01 fixed** — `quietHoursSchema.tz` now `.refine`s against `Intl`
  (`packages/core/src/domain/schemas.ts`). A bogus zone → `400 validation_error`
  before it can be stored. Pinned test `ME-02b` flipped from 200 to assert 400.
- **BUG-02 fixed** — added a partial-unique index on `{ createdBy: 1 }` filtered
  to `status: 'live'` (`apps/main-backend/src/models/invite.model.ts`).
  `createInvite` now treats an 11000 on the creator index as "a concurrent invite
  won": it drops its orphan pending pair and returns the winner's invite (both
  callers still get 201 with the same code). Because it's a DB index, the guard
  also holds on the standalone in-memory test path, not just the replica set.
  Re-run `race.manual.mjs` SM-RACE-03 on a replica set to reconfirm.

Residual risks (rate limiting on `/auth/login`, stateless-logout non-revocation)
remain open and are carried to Phase 2 as flagged.

---

## Artifacts added

- `apps/main-backend/test/qa-gaps.test.ts` — 48 cases (auth, settings, gate,
  validation, pairing edges, reactions, push, cross-cutting). Hermetic, CI-safe.
- `apps/main-backend/test/qa-media-contract.test.ts` — 13 cases (media gate with
  file-service stubbed, full seam/contract). Hermetic, CI-safe.
- `apps/main-backend/test/race.manual.mjs` — replica-set race harness (SM-RACE).
  Not part of the CI vitest run (needs a replica set); run manually:
  `mongod --replSet rs0 --port 27018 …` then `node --import tsx test/race.manual.mjs`.

## How to reproduce

```bash
# In-memory suite (89 tests):
pnpm -F @lovebook/main-backend test

# Race tests (needs a replica set):
mongod --replSet rs0 --port 27018 --dbpath /tmp/rs --bind_ip 127.0.0.1 &
mongosh --port 27018 --eval "rs.initiate()"
cd apps/main-backend && node --import tsx test/race.manual.mjs
```
