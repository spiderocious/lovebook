# Backend Test Plan — lovebook (Phase 1, whole API)

**Prepared:** 2026-06-13
**Role:** QA Engineer — Backend Systems (code-flow audit + real API execution)
**Spec sources:** [api-reference.md](../api/api-reference.md) · [backend-qa-handoff.md](./backend-qa-handoff.md) · [seam-contract.md](./seam-contract.md)
**Base URL:** `http://localhost:9092/api/v1`
**Auth:** self-serve via `POST /auth/register` (no seed script this phase)
**Build at planning time:** typecheck ✅ · lint ✅ · `pnpm -F @lovebook/main-backend test` → **28/28 pass**

> This is the **plan only**. No tests are executed yet. It states what will be
> tested, at what level, how to verify each case, and — explicitly — what is out
> of scope and what risks remain.

---

## 1. How I will test (tooling & method)

Two modes, in this order, per the backend-QA discipline:

1. **Code-flow audit (source review)** — read every route/service/schema/middleware
   in scope *before* running anything. File architectural violations as findings
   (§4) before execution. Already partially done during planning (§4).
2. **API execution** — hit every endpoint for real and verify side effects:
   - **HTTP:** `curl` against a running backend (`pnpm -F @lovebook/main-backend dev`),
     asserting exact status, exact `error.code`, exact body shape.
   - **DB ground truth:** `mongosh $MONGODB_URI` to confirm side effects
     (pair locked, posts scoped to `pairId`, reaction upserted not duplicated,
     account-deletion cascade, invite TTL index present).
   - **Contract parsing:** run representative responses through the `@lovebook/core`
     Zod schemas / TS types to assert no drift (the seam, §7).

**Two execution surfaces, both valid:**
- **In-repo (vitest + supertest + mongodb-memory-server):** the existing 28 tests
  run here. New gap cases (§5) are cheapest to add here — hermetic, no external
  Mongo, runs in CI. This is the primary surface for everything except
  transaction-dependent and file-service-dependent cases.
- **Live curl + mongosh:** required for the cases the in-memory server can't model
  faithfully — the **atomic pair-lock under a real transaction** (needs a replica
  set; in-memory mongod is standalone → exercises only the CAS fallback) and the
  **file-service proxy** (upload-uri / view-uri). Run these against
  `mongod --replSet rs0` + `rs.initiate()`.

**Guardrails I will hold to:**
- Never a permissive assertion (`status < 500` is not a test). Exact status +
  exact `error.code` + exact shape, every case.
- Never mock Mongo for integration cases — real in-memory mongod or real replica set.
- Never stub the file-service with real creds — stub `FILE_SERVICE_BASE_URL`.
- Every endpoint gets a contract check against its `core` schema (the seam).

---

## 2. Scope

**In scope (the whole Phase-1 API):** auth, settings (`/me`), pairing + state
machine, feed/posts, the media access-gate, reactions, push, health. All routes
in [backend-qa-handoff.md §Endpoints](./backend-qa-handoff.md).

**Out of scope (will not test — and why):**
- Frontend UI — none exists this phase (Phases 2+).
- Magic-link sign-in — not built (reserved seam).
- Year-in-review — cut from product.
- Server-side voice transcode, deferred-delivery quiet-hours queue, server-side
  notification batching — documented as not-yet-built in the handoff.
- Real Web Push delivery to a browser endpoint — VAPID unset in test; I verify
  the *subscribe/unsubscribe/key* contract and the *skip-while-muted* logic, not
  actual FCM/web-push wire delivery.

---

## 3. What's already covered (baseline — 28 tests)

So the plan targets **gaps**, not re-runs. Existing vitest coverage:

| File | Covers |
|------|--------|
| `auth.test.ts` (7) | register 201, dup email 409, short pw 400+field_errors, login 200, bad creds 401, refresh shape, `/me` auth |
| `pair.test.ts` (8) | invite mint, lookup by code+pairId, claim/lock, claim-own 403, double-pair 409, bogus ref 404, leave→archive, re-pair |
| `feed.test.ts` (8) | pair-gate 403, create+both-see, text>200 & voice>30s 400, cursor paging, cross-pair feed isolation, cross-pair media 403, reaction set/replace/clear, bad emoji 400 |
| `me.test.ts` (5) | name+quietHours update, empty patch 400, delete cascade + partner archive, health public, push key public-null |

**Verdict:** happy paths and the headline edges are covered. The gaps below are
where real bugs hide: auth token negatives, the seam/contract shapes, the
membership-gate matrix per route, idempotency/upsert under concurrency, the
atomic pair-lock race, validation boundaries, and cross-cutting invariants.

---

## 4. Code-flow audit findings (from planning review)

Status: no P1 violations found in the structural sweep. Routes are correctly
wrapped (`asyncHandler`), guarded (`requireAuth` / `requirePair`), and responses
go through `ResponseUtil`; services return `ServiceResult` (`Ok`/`Err`), never
throw business errors. Items below are **observations to confirm during
execution**, not confirmed bugs.

| ID | File | Observation | Sev | Verify by |
|----|------|-------------|-----|-----------|
| SA-01 | `push.routes.ts:15-22` | `GET /push/key` is registered **before** `router.use(requireAuth)`, so it's public (correct per spec); confirm `subscribe`/`unsubscribe` (after the `use`) actually require auth and 401 without a token. | P2 | EXEC AUTH-PUSH |
| SA-02 | `pair.service.ts:103-130` | Atomic claim has a **CAS fallback** when no transaction support. The in-memory test mongod is standalone → the transaction path is **never exercised by the existing suite**. Race correctness on the real (replica-set) path is unverified. | P1 | EXEC SM-RACE (replica set) |
| SA-03 | `post.service.ts:42-44` | Push notify is fire-and-forget (`void ... .catch`). A push failure must **not** fail `POST /posts`. Confirm a 201 still returns when the push path throws. | P2 | EXEC FEED-07 |
| SA-04 | `media.service.ts:21-30` | View-URI gate checks `post.pairId === caller pairId` then calls the file-service. Confirm `404 Media` (no `mediaKey`) vs `403` (wrong pair) vs `404 Post` (no post) are correctly distinguished. | P2 | EXEC MEDIA-* |
| SA-05 | `auth.middleware.ts:10-18` | Token parsing accepts `Bearer ` prefix only. Confirm malformed header, empty token, wrong-secret JWT, and **expired** access token all → `401`. | P1 | EXEC AUTH-NEG-* |
| SA-06 | `serialize.ts` | Single Doc→DTO point. Confirm **no secret leakage** (`passwordHash`, `tokenVersion`, `__v`, raw `_id`) ever appears in any response. | P1 | EXEC X-03 |
| SA-07 | `pair.service.ts:130-134` | After lock, pair is re-read. Confirm `GET /pair` returns `members: [{id,name,avatarKey}]` (no email leak into the pair member shape). | P2 | EXEC X-03 |

Re-run the persona's grep sweep at execution start to confirm none of these
regressed: `throw new Error` in services, `res.json` bypassing `ResponseUtil`,
async handlers without `asyncHandler`, `z.any()` in schemas, `: any` / `as any`.

---

## 5. Test matrix — gaps to add (by domain)

Layer key: **C** = contract (parse through core schema, assert no throw) ·
**I** = integration (handler→service→Mongo) · **E2E** = multi-step flow.

### 5.1 Auth — negatives & token lifecycle (the biggest gap)

| # | Test | Method + Path | Expected | Layer |
|---|------|---------------|----------|-------|
| AUTH-01 | No token on protected route | `GET /auth/me` (no header) | 401 `unauthorized` | I |
| AUTH-02 | Malformed header (`Token x`, not `Bearer`) | `GET /auth/me` | 401 `unauthorized` | I |
| AUTH-03 | `Bearer ` with empty/garbage token | `GET /auth/me` | 401 `unauthorized` | I |
| AUTH-04 | **Expired** access token | `GET /auth/me` w/ expired JWT | 401 `unauthorized` | I |
| AUTH-05 | Token signed with wrong secret | `GET /auth/me` | 401 `unauthorized` | I |
| AUTH-06 | Refresh with invalid/garbage refresh_token | `POST /auth/refresh` | 401 | I |
| AUTH-07 | Refresh returns a **new, different** access token | `POST /auth/refresh` | 200, new token != old, both valid shape | I |
| AUTH-08 | Register: name boundaries (0 chars, 61 chars) | `POST /auth/register` | 400 `validation_error` + `field_errors.name` | I |
| AUTH-09 | Register: invalid email format | `POST /auth/register` | 400 `field_errors.email` | I |
| AUTH-10 | Register: password 200 chars (upper bound OK) / 201 chars (reject) | `POST /auth/register` | 201 / 400 | I |
| AUTH-11 | Login unknown email | `POST /auth/login` | 401 `unauthorized` (not 404 — no enumeration) | I |
| AUTH-12 | Logout is 204 and stateless (old token still parses) | `POST /auth/logout` then `GET /auth/me` | 204; me still 200 (documented stateless limit) | E2E |
| AUTH-C1 | Register/login response parses through core auth schema | both | no throw; `tokens.{access_token,refresh_token}` snake_case | C |

> AUTH-12 documents the **known** stateless-JWT limitation: logout does not
> revoke. Flagged as a risk (§9), not a bug, since the handoff states it.

### 5.2 Settings (`/me`)

| # | Test | Method + Path | Expected | Layer |
|---|------|---------------|----------|-------|
| ME-01 | Set `avatarKey` then clear with `null` | `PATCH /me` ×2 | 200; `avatarKey` toggles value→`null` | I |
| ME-02 | quietHours bad time format (`"25:00"`, `"9am"`) | `PATCH /me` | 400 `field_errors.quietHours` | I |
| ME-03 | quietHours set then clear with `null` | `PATCH /me` | 200; `quietHours` → `null` (not omitted) | I |
| ME-04 | Unknown field in body (e.g. `email`, `pairId`) | `PATCH /me` | ignored or 400 — assert email/pairId **not** mutated | I |
| ME-05 | `PATCH /me` no auth | `PATCH /me` | 401 | I |
| ME-06 | Delete with **no** active pair (solo user) | `DELETE /me` | 204; no orphan pair archive | I |
| ME-07 | After `DELETE /me`, posts/reactions/push-subs gone | `DELETE /me` + mongosh counts | 0 own posts, 0 reactions, 0 push subs | I |
| ME-C1 | `User` DTO parses through core type | `GET /auth/me` | no throw; `avatarKey/pairId/quietHours` all `T \| null` | C |

### 5.3 Pairing — state machine & guards (extend beyond baseline)

| # | Test | Method + Path | Expected | Layer |
|---|------|---------------|----------|-------|
| PAIR-01 | Re-invite returns the **same live code** (idempotent) | `POST /pair/invite` ×2 | identical `code`+`pairId` | I |
| PAIR-02 | Lookup own pairId/code as initiator | `GET /pair/lookup/:ref` | 200 preview (lookup ≠ claim) | I |
| PAIR-03 | Lookup with a 24-hex but non-existent pairId | `GET /pair/lookup/<bogus oid>` | 404 `not_found` | I |
| PAIR-04 | Claim an **expired** invite (force `expiresAt` past in DB) | `POST /pair/claim` | 404 `not_found` | I |
| PAIR-05 | Claim an **already-claimed** invite (third user) | `POST /pair/claim` | 404 `not_found` (no leak) | I |
| PAIR-06 | `GET /pair` when unpaired | `GET /pair` | 200 `data: null` (not 403/404) | I |
| PAIR-07 | `POST /pair/leave` when not in a pair | `POST /pair/leave` | 404 `not_found` | I |
| PAIR-08 | After leave, both users `pairId === null` | `POST /pair/leave` + mongosh | both unpaired; pair `status:archived`, `archivedAt` set | I |
| PAIR-09 | Archives list newest-first, read-only | `GET /pair/archives` | array, ordered, members populated | I |
| PAIR-10 | Invite TTL index exists on `expiresAt` | mongosh `getIndexes()` | TTL index present (the 24h reaper) | I |
| PAIR-C1 | `Pair` + `Invite` + `InvitePreview` parse through core | each | no throw; `archivedAt: ISO\|null`, members `{id,name,avatarKey}` only | C |

### 5.4 Pairing — concurrency / the atomic lock (replica-set surface)

| # | Test | Setup | Expected | Layer |
|---|------|-------|----------|-------|
| SM-RACE-01 | Two users claim the **same** invite simultaneously | replica set; fire 2 concurrent `POST /pair/claim` | exactly one 200; other 409/404; mongosh: pair has **2** members, no third write | E2E |
| SM-RACE-02 | Initiator pairs elsewhere between invite & claim | initiator claims a second invite, then original claimer claims | original claim 409/404; claimer rolled back to unpaired (mongosh) | E2E |
| SM-RACE-03 | One user, two concurrent `POST /pair/invite` | fire 2 in parallel | at most one live invite (CAS/unique index holds); no duplicate pending pair | E2E |
| SM-CAS-01 | Same as SM-RACE-01 on **standalone** mongod | no replica set | CAS fallback still yields single winner | E2E |

> Invariant under test: **a user holds at most one non-archived pair**, even under
> concurrent claims. This is the highest-risk surface and the one the existing
> suite cannot exercise (in-memory mongod = standalone → transaction path unrun).

### 5.5 Feed + posts

| # | Test | Method + Path | Expected | Layer |
|---|------|---------------|----------|-------|
| FEED-01 | Empty feed (paired, no posts) | `GET /feed` | 200 `posts: []` (never null), `nextCursor: null`, `hasMore: false` | I |
| FEED-02 | `limit` boundaries: `0`, `1`, `50`, `51`, non-numeric | `GET /feed?limit=` | clamp to [1,50] or 400 — assert chosen behavior is consistent | I |
| FEED-03 | `hasMore=true` then `false` across last page | seed 25, page by 20 | page1 hasMore true + cursor; page2 hasMore false, cursor null | I |
| FEED-04 | Cursor with bogus/`non-oid` value | `GET /feed?cursor=xxx` | 400 or empty page — assert it doesn't 500 | I |
| FEED-05 | Photo post requires `mediaKey`; missing → 400 | `POST /posts {type:photo}` | 400 `field_errors.mediaKey` | I |
| FEED-06 | Voice post `durationMs` boundaries: 0, 1, 30000, 30001 | `POST /posts` | 0/30001 → 400; 1/30000 → 201 | I |
| FEED-07 | Post **succeeds** even if push notify throws (SA-03) | stub push to throw | 201 returned; post persisted | I |
| FEED-08 | Post by member B also lands in shared feed | `POST /posts` (B) then `GET /feed` (A) | both members' posts interleaved newest-first | E2E |
| FEED-09 | Unknown `type` in discriminated union | `POST /posts {type:"gif"}` | 400 `validation_error` | I |
| FEED-10 | `text` post with extra `mediaKey` field | `POST /posts` | rejected or stripped — assert no media on a text post | I |
| FEED-C1 | `FeedPage` + `Post` parse through core | `GET /feed` | no throw; `nextCursor: string\|null`, `hasMore: boolean`, nullable post fields | C |

### 5.6 Media access-gate

| # | Test | Method + Path | Expected | Layer |
|---|------|---------------|----------|-------|
| MEDIA-01 | View URI for own pair's photo post | `GET /posts/:id/media` | 200 `{uri, expiresIn}` (file-service stubbed) | I |
| MEDIA-02 | View URI for a **text** post (no media) | `GET /posts/:id/media` | 404 `not_found` (Media) | I |
| MEDIA-03 | View URI for non-existent post id | `GET /posts/:id/media` | 404 `not_found` (Post) | I |
| MEDIA-04 | Cross-pair view URI (other pair's post) | `GET /posts/:id/media` | 403 `forbidden` | I |
| MEDIA-05 | Upload-uri: `ext` alphanumeric vs symbol/empty | `GET /media/upload-uri?ext=` | 200 for valid; 400 for bad ext | I |
| MEDIA-06 | Upload-uri/view-uri while unpaired | both | 403 `forbidden` (pair gate) | I |
| MEDIA-07 | File-service down → graceful error, not 500 stack | stub 5xx | mapped error envelope, no leak | I |

### 5.7 Reactions

| # | Test | Method + Path | Expected | Layer |
|---|------|---------------|----------|-------|
| RX-01 | All 6 valid emojis accepted | `PUT /posts/:id/reaction` ×6 | 200 each | I |
| RX-02 | Re-tap **replaces**, never duplicates | `PUT` ×2 + mongosh | 1 reaction doc (unique index on post+reactor) | I |
| RX-03 | Partner reacts to same post (separate reaction) | `PUT` by B | both reactions coexist (per-person) | I |
| RX-04 | Clear is idempotent (clear with none set) | `DELETE` ×2 | 204 both times | I |
| RX-05 | React to cross-pair post | `PUT /posts/:id/reaction` | 403 `forbidden` | I |
| RX-06 | React to non-existent post | `PUT` | 404 `not_found` | I |
| RX-07 | Missing/empty emoji body | `PUT` `{}` | 400 `field_errors.emoji` | I |
| RX-C1 | `Reaction` DTO parses through core | `PUT` | no throw; `{emoji, reactorId, createdAt}` | C |

### 5.8 Push

| # | Test | Method + Path | Expected | Layer |
|---|------|---------------|----------|-------|
| PUSH-01 | `GET /push/key` public, returns `{key: null}` when VAPID unset | `GET /push/key` | 200 `data.key: null` | I |
| PUSH-02 | `subscribe`/`unsubscribe` **require auth** (SA-01) | both no token | 401 | I |
| PUSH-03 | Subscribe upserts by `endpoint` (no dup) | `POST /push/subscribe` ×2 same endpoint | 1 sub doc in mongosh | I |
| PUSH-04 | Subscribe bad body (non-url endpoint, missing keys) | `POST /push/subscribe` | 400 `validation_error` | I |
| PUSH-05 | Unsubscribe unknown endpoint | `POST /push/unsubscribe` | 200 `{ok:true}` (idempotent) | I |
| PUSH-06 | Notify **skipped** while recipient in quiet hours | unit: set quietHours, trigger notify | no send attempted | I (unit) |

---

## 6. Cross-cutting matrices

### 6.1 Auth + pair gate (per route)

`✅` allowed · `401` no token · `403` authed-but-unpaired · `—` n/a

| Endpoint | no token | authed, unpaired | authed, paired |
|----------|:--------:|:----------------:|:--------------:|
| `POST /auth/*`, `GET /health`, `GET /push/key` | ✅ | ✅ | ✅ |
| `GET /auth/me`, `PATCH /me`, `DELETE /me` | 401 | ✅ | ✅ |
| `POST /pair/invite`, `/claim`, `/leave`, `GET /pair*` | 401 | ✅ | ✅* |
| `GET /feed`, `POST /posts`, `GET /posts/:id/media` | 401 | **403** | ✅ |
| `PUT/DELETE /posts/:id/reaction` | 401 | **403** | ✅ |
| `GET /media/upload-uri` | 401 | **403** | ✅ |
| `POST /push/subscribe`, `/unsubscribe` | 401 | ✅ | ✅ |

\* `invite`/`claim` enforce their own pair invariants (409/403) on top of auth.

### 6.2 State machine

| # | Transition | Trigger | Expected |
|---|-----------|---------|----------|
| SM-01 | unpaired → pending | `POST /pair/invite` | 201 invite; pair `pending`; initiator `pairId` still null |
| SM-02 | pending → active | `POST /pair/claim` (other user) | 200; both `pairId` set; invite marked claimed |
| SM-03 | active → archived | `POST /pair/leave` | 200; both unpaired; `archivedAt` set |
| SM-04 | active → archived (via partner delete) | partner `DELETE /me` | survivor unpaired, holds read-only archive |
| SM-05 | pending → reaped | 24h TTL | invite gone (TTL index) — verify index, not wall-clock |
| SM-06 | claim own invite | initiator claims | 403 `forbidden` |
| SM-07 | invite while paired | `POST /pair/invite` paired | 409 `conflict` |
| SM-08 | claim while paired | `POST /pair/claim` paired | 409 `conflict` |
| SM-09 | re-pair after leave | invite→claim after leave | 200 (allowed) |

### 6.3 Cross-cutting invariant checks

| # | Check | How |
|---|-------|-----|
| X-01 | All dates ISO 8601 strings (`createdAt`, `expiresAt`, `archivedAt`) | regex assert on responses |
| X-02 | IDs are 24-char Mongo ObjectId hex | regex assert |
| X-03 | **No secret fields** in any response (`passwordHash`, `tokenVersion`, `__v`, `password`) | grep every response body; member shape has no `email` |
| X-04 | Nullable fields serialize as `null`, never omitted | assert key present with `null` |
| X-05 | Error envelope shape `{error:{code,message,field_errors?}}` on every 4xx | parse all error responses |
| X-06 | Success envelope `{data:...}` on every 2xx | parse all success responses |
| X-07 | Empty arrays are `[]` never `null` (feed, archives) | assert |
| X-08 | `requestId` present on responses / logs | header/log check |
| X-09 | Unknown route → 404 envelope (not raw Express HTML) | `GET /api/v1/nope` |
| X-10 | Body > 1mb rejected (express json limit) | oversized POST → 413/400 |

---

## 7. Seam contract verification (drift prevention)

Run the [seam-contract.md](./seam-contract.md) checklist as executable assertions —
parse real responses through the `@lovebook/core` schemas/types. The drift items
that **must** hold (each becomes a `C` test above):

- [ ] Mongoose field names ↔ core DTO names match (enforced by `serialize.ts`).
- [ ] Nullable fields use `| null` on both sides (User.avatarKey/pairId/quietHours,
      Post.text/mediaKey/durationMs/reaction, Pair.archivedAt) — never optional `?`.
- [ ] `FeedPage { nextCursor: string|null, hasMore: boolean }`; first page omits `?cursor`.
- [ ] Dates are ISO strings (no number math possible).
- [ ] Empty feed/archives → `[]`.
- [ ] Errors branch on `error.code`, never `error.message`.
- [ ] Auth refresh shape `{ data: { access_token, refresh_token } }` (ky client pin) — **do not change**.
- [ ] Reaction emoji constrained to the 6 on both sides.
- [ ] Post create is a discriminated union on `type` (text ≤200, voice ≤30000).

---

## 8. Execution order (when testing starts)

1. **Re-run audit greps** (§4) — confirm no structural regressions. Fast, free.
2. **In-repo gap suite** — add §5.1–5.3, 5.5–5.8 + §6.1–6.3 + §7 as vitest cases
   (hermetic, in-memory mongod). This is the bulk and runs in CI.
3. **Live replica-set run** — §5.4 (atomic lock race) + SA-02. Requires
   `mongod --replSet rs0`. The only cases the in-memory server can't cover.
4. **File-service cases** — §5.6 with `FILE_SERVICE_BASE_URL` stubbed (success +
   5xx degraded path).
5. Produce the **execution report**: PASS/FAIL/BLOCKED per case, bug list with
   severity + repro + fix, out-of-scope restated, residual risks (§9).

---

## 9. Residual risks (carried forward, not bugs)

| Risk | Why not tested / why it matters |
|------|---------------------------------|
| **Logout doesn't revoke** | Stateless JWT — an access token stays valid until expiry post-logout (AUTH-12). Documented limit; flag for Phase 2 (token-version / denylist). |
| **No rate limiting** | No `429`/`Retry-After` path found on auth. Brute-force on `/auth/login` is unbounded this phase. Confirm during exec; flag if absent. |
| **Transaction path only on replica set** | CI runs standalone in-memory mongod → only the CAS fallback is exercised there. The real atomic-lock path needs the §5.4 replica-set run; if that's skipped, SM-RACE correctness is unverified. |
| **Push delivery not E2E** | VAPID unset; only the subscribe/skip-while-muted *contract* is tested, not real web-push wire delivery. |
| **Quiet-hours = skip, not defer** | Notifications during quiet hours are dropped, not queued for unmute (documented). Behavioral, not a bug. |
| **TTL reaping is index-based** | SM-05 verifies the index exists, not that Mongo's background reaper fired (can lag up to 60s). True expiry depends on Mongo's TTL monitor. |

---

## 10. Deliverables

1. This **test plan** (you are reading it).
2. **Gap test suite** added under `apps/main-backend/test/` (new cases from §5–7),
   kept hermetic for CI; replica-set/file-service cases marked/guarded.
3. **Execution report** — PASS/FAIL/BLOCKED table, bug list (severity + repro +
   fix), restated out-of-scope, residual risks. Written after execution.
