# Backend QA Handoff — lovebook (Phase 1, the whole API)

**Date:** 2026-06-13
**Branch:** main
**Build:** Typecheck ✅ · Lint ✅ · Tests ✅ (vitest + mongodb-memory-server)
**Base URL:** `http://localhost:9092/api/v1`
**Auth header:** `Authorization: Bearer <access_token>`

The entire MVP API is implemented in this phase (auth, pairing, feed/posts,
media gate, reactions, settings, push). It is testable end-to-end with a REST
client against a running backend + MongoDB — no UI required.

---

## Running it

```bash
# 1. MongoDB — for the atomic pair-lock to use a transaction, run a replica set
#    (or use Atlas). A standalone mongod also works via the guarded CAS fallback.
mongod --replSet rs0           # then in mongosh: rs.initiate()
# 2. Env
cp apps/main-backend/.env.example apps/main-backend/.env   # set MONGODB_URI + JWT secrets
# 3. Run
pnpm -F @lovebook/main-backend dev      # http://localhost:9092
# 4. Tests (self-contained, in-memory Mongo)
pnpm -F @lovebook/main-backend test
```

No seed script ships this phase — accounts are self-serve via `POST /auth/register`.
Create two users and pair them (steps below) to exercise the full surface.

---

## Seed-by-hand (two paired users)

| Step | Call | Result |
|------|------|--------|
| 1 | `POST /auth/register` `{email:"ada@test.test", name:"Ada", password:"Password123!"}` | Ada + tokens |
| 2 | `POST /auth/register` `{email:"ben@test.test", name:"Ben", password:"Password123!"}` | Ben + tokens |
| 3 | `POST /pair/invite` (Ada's token) | `{ code, pairId, expiresAt }` |
| 4 | `POST /pair/claim` (Ben's token) `{ ref: <code> }` | active `Pair` |
| 5 | `POST /posts` (Ada) `{type:"text", text:"hi"}` | post at top of both feeds |

---

## Endpoints Implemented

| Method | Path | Auth | Pair | Notes |
|--------|------|:----:|:----:|-------|
| POST | `/auth/register` | – | – | 201; 409 if email taken |
| POST | `/auth/login` | – | – | 401 on bad creds |
| POST | `/auth/refresh` | – | – | shape pinned by ky client |
| POST | `/auth/logout` | – | – | 204 (stateless) |
| GET | `/auth/me` | ✅ | – | profile |
| PATCH | `/me` | ✅ | – | name / avatarKey / quietHours |
| DELETE | `/me` | ✅ | – | deletes own data; partner keeps archive |
| POST | `/pair/invite` | ✅ | – | 409 if already paired |
| GET | `/pair/lookup/:ref` | ✅ | – | code or pairId; 404 on any miss |
| POST | `/pair/claim` | ✅ | – | 403 own invite, 409 already paired |
| GET | `/pair` | ✅ | – | active pair or `null` |
| POST | `/pair/leave` | ✅ | – | archives |
| GET | `/pair/archives` | ✅ | – | read-only past pairs |
| GET | `/feed` | ✅ | ✅ | cursor pagination |
| POST | `/posts` | ✅ | ✅ | text / photo / voice |
| GET | `/posts/:id/media` | ✅ | ✅ | the access gate |
| PUT | `/posts/:id/reaction` | ✅ | ✅ | upsert |
| DELETE | `/posts/:id/reaction` | ✅ | ✅ | 204 |
| GET | `/media/upload-uri` | ✅ | ✅ | proxies file-service |
| GET | `/push/key` | – | – | VAPID public key |
| POST | `/push/subscribe` | ✅ | – | upsert by endpoint |
| POST | `/push/unsubscribe` | ✅ | – | |
| GET | `/health` | – | – | probe |

"Pair ✅" routes return **403 `forbidden`** when the caller is not in an active pair.

---

## Pairing State Machine

| State | Transition | Trigger | Guard |
|-------|-----------|---------|-------|
| (unpaired) | → `pending` | `POST /pair/invite` | caller not already paired (else 409) |
| `pending` | → `active` | `POST /pair/claim` | claimer unpaired (409) · not the initiator (403) · invite live (404) |
| `pending` | → reaped | 24h TTL | Mongo TTL index on `expiresAt` |
| `active` | → `archived` | `POST /pair/leave` or partner `DELETE /me` | caller in the pair |

- A user has **at most one** non-archived pair. After leaving, they may re-pair.
- The shareable link uses the `pairId` (UUID-grade); the 6-char code is the typed
  handshake only (PRD §12). Both resolve via `lookup`/`claim`.

---

## Critical Edge Cases to Verify

| Scenario | Expected |
|----------|----------|
| Register duplicate email | `409 conflict` |
| Password < 8 chars | `400 validation_error` + `field_errors.password` |
| Login wrong password | `401 unauthorized` |
| Lookup bad/expired/claimed code | `404 not_found` (never distinguished) |
| Claim own invite | `403 forbidden` |
| Invite while already paired | `409 conflict` |
| Feed / post while unpaired | `403 forbidden` |
| Text > 200 chars | `400 validation_error` |
| Voice `durationMs` > 30000 | `400 validation_error` |
| Reaction emoji not in the 6 | `400 validation_error` |
| Second reaction by same user on same post | replaces (no duplicate); unique index |
| **Cross-pair feed read** | other pair's posts never appear (scoped by `pairId`) |
| **Cross-pair `GET /posts/:id/media`** | `403 forbidden` (the gate) |
| Account deletion | own posts/reactions gone; partner's archive intact |

---

## Pagination

- **Type:** cursor-based (never offset).
- **Cursor field:** `nextCursor` (the last post's id) · **Has more:** `hasMore`.
- First page: no `cursor` param. Next: `?cursor=<nextCursor>&limit=<1–50>`.
- Order: newest first (`_id` descending within the pair).

---

## Notes & Known Limits (this phase)

- **No frontend** yet — Phases 2+ build it on this API.
- **Magic-link sign-in** not built (email+password only; reserved seam).
- **Quiet hours** currently *skip* delivery while muted; a deferred-delivery
  queue (deliver at unmute) is a later refinement. Batching is the SW `tag`
  collapse + caller debounce, not a server-side window aggregator yet.
- **Voice** stored as the uploaded blob (Opus/WebM expected); no server transcode.
- **Push** sends only when VAPID env is set; `GET /push/key` returns `null` otherwise.

---

## Out of Scope (do not test here)

- [ ] Year-in-review — cut from the product.
- [ ] Any frontend UI.
- [ ] Magic-link email flow.
