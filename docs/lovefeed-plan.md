# LoveFeed — Implementation Plan

**Status:** Plan for review (pre-implementation)
**Author:** Fullstack
**Date:** 2026-06-13
**Source of truth:** `dockito/projects/lovebook/prd.md` (LoveFeed v1 spec)

A two-person ambient feed. Post a moment, your person sees it. No replies, no
metrics, just presence. This document is the build contract: data models, every
endpoint shape, the pairing state machine, the offline/push strategy, and the
phase order. Read it before writing code. Conventions are inherited from
`docs/rules.md` and the backend/frontend/fullstack personas.

---

## 1. Decisions locked

| Concern | Decision | Notes |
|---|---|---|
| Backend runtime | **Express** (existing scaffold) | Build on `buildApp()`, `ResponseUtil`, `AppError`, `asyncHandler`. |
| Frontend | **`apps/web`** (Vite + React 19, PWA) | Design system already lives here. `vite-plugin-pwa` + Workbox. |
| Database | **MongoDB + Mongoose** | Typed models feed the `@lovebook/core` seam. Cursor pagination on `_id`. |
| Auth (v1) | **email + password** (bcrypt + JWT) | Magic link stubbed, wired later. |
| Media | **go-file-service proxy** | Our backend is the access-control layer; stores keys only. |
| Push | **Web Push (VAPID) + service worker** | iOS 16.4+ home-screen-installed only — known risk (PRD §12). |
| Package scope | **`@lovebook/*` unchanged** | Already matches the product. No rebrand. |

### Doctrine adaptations forced by MongoDB

The backend persona's non-negotiables were written for Postgres. Mapping:

- **"Never offset pagination — cursor only."** Held. Cursor on `_id` (ObjectId is
  time-monotonic) or `{ createdAt, _id }` compound for stable ordering. Never `.skip()`.
- **"Never throw from the service layer — return `ServiceResult<T>`."** Held. See §3.
- **Repo pattern.** `feature.repo.ts` wraps the Mongoose model. Services never
  import `req` and never touch `express`.
- **Money as integer.** N/A — LoveFeed has no money. (Durations stored as integer ms.)

---

## 2. Data model (MongoDB collections)

Five collections. ObjectId `_id` everywhere; exposed to clients as `id: string`.
All timestamps stored as native `Date`, serialized as ISO 8601 strings at the seam.

### `users`
```
_id            ObjectId
email          string   (unique, lowercased, indexed)
passwordHash   string   (bcrypt; absent for magic-link-only users later)
name           string   (display name, shown to the paired user)
avatarKey      string?  (file-service key; null until set)
pairId         ObjectId? (current active pair; null when unpaired)
quietHours     { start: string, end: string, tz: string } | null  ("HH:mm", IANA tz)
createdAt      Date
updatedAt      Date
```
Indexes: `email` unique. `pairId`.

### `pairs`
```
_id            ObjectId
memberIds      ObjectId[]  (exactly 2 once locked; 1 while pending)
status         'pending' | 'active' | 'archived'
createdAt      Date         (pairing moment — year-in-review anchors here)
archivedAt     Date?
createdBy      ObjectId     (initiator)
```
Indexes: `memberIds`. `status`.

A user's `pairId` always points at their one **active** pair. Archived pairs are
found by querying `pairs` where `memberIds` contains the user and
`status: 'archived'` (the "Past pairs" section).

### `invites`
```
_id            ObjectId
code           string   (6-char A–Z0–9, uppercase, unique while live, indexed)
pairId         ObjectId (the pending pair the initiator created)
createdBy      ObjectId
expiresAt      Date     (createdAt + 24h)  — TTL index
claimedAt      Date?
status         'live' | 'claimed' | 'expired' | 'cancelled'
```
Indexes: `code` (unique partial: `status: 'live'`). `expiresAt` TTL (auto-expiry).
`pairId`.

> PRD §12: codes are for the handshake only — never permanent IDs. The shareable
> link uses the pair UUID, not the code: `feed.app/pair/<pairId>`. The code is
> typed; the link carries the id. Both resolve to the same pending pair.

### `posts`
```
_id            ObjectId
pairId         ObjectId  (indexed — every feed query scopes to this)
authorId       ObjectId
type           'photo' | 'voice' | 'text'
text           string?   (type=text; ≤200 chars)
mediaKey       string?   (type=photo|voice; file-service key)
durationMs     number?   (type=voice; ≤30000)
createdAt      Date
```
Indexes: `{ pairId: 1, _id: -1 }` compound (the feed cursor query). 

> Posts are **immutable** (no edit per PRD). No `updatedAt`. Reactions live
> separately so a reaction write never touches the post document.

### `reactions`
```
_id            ObjectId
postId         ObjectId  (indexed)
pairId         ObjectId
reactorId      ObjectId
emoji          string    (one of the 6 allowed)
createdAt      Date
updatedAt      Date
```
Indexes: `{ postId: 1, reactorId: 1 }` **unique** — enforces "one reaction per
post per person". A re-tap upserts (changes the emoji); it never creates a second.

### Push subscriptions (sub-collection or own collection)

### `push_subscriptions`
```
_id            ObjectId
userId         ObjectId  (indexed)
endpoint       string    (unique)
keys           { p256dh: string, auth: string }
createdAt      Date
```

---

## 3. Backend architecture

### Service result contract (new — `lib/result.ts`)
The scaffold throws `AppError` from handlers today. The personas mandate
services return a result, controllers unwrap. We add:

```ts
export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: AppError };

export const Ok  = <T>(data: T): ServiceResult<T> => ({ ok: true, data });
export const Err = (error: AppError): ServiceResult<never> => ({ ok: false, error });
```

Controllers call the service, and on `!ok` **throw `result.error`** so the
existing `errorHandler` middleware translates it to the envelope. This keeps the
service HTTP-free while reusing the central error sink. (We throw at the
controller boundary, never inside the service.)

### Feature module shape (per `docs/rules.md`)
Each `src/features/<name>/`:
```
index.ts            export register(app): mounts the router at its prefix
<name>.routes.ts    express Router; parse via schema; call service; unwrap → ResponseUtil
<name>.service.ts   business logic; returns ServiceResult<T>; no req, no express
<name>.repo.ts      Mongoose model access; the only file that knows about the DB
<name>.schema.ts    zod request schemas
<name>.types.ts     DTO + domain types (the ones shared go to @lovebook/core)
<name>.model.ts     Mongoose schema + model
```

### New infrastructure
- `src/lib/db.ts` — Mongoose connect/disconnect, called from `server.ts` before listen.
- `src/lib/jwt.ts` — sign/verify access + refresh (uses existing `JWT_*` env).
- `src/lib/password.ts` — bcrypt hash/compare.
- `src/middlewares/auth.middleware.ts` — verify Bearer, set `userId`/`role` on
  request context (`requestContext` already supports these fields), `401` on fail.
- `src/middlewares/requirePair.middleware.ts` — load the caller's active pair,
  attach `pairId`; `403` if unpaired. Used by feed/post/reaction routes.

### env additions (`src/env.ts`)
```
MONGODB_URI            string (required)
FILE_SERVICE_BASE_URL  string url (default the railway URL)
VAPID_PUBLIC_KEY       string (push — optional until Phase 7)
VAPID_PRIVATE_KEY      string (push — optional until Phase 7)
VAPID_SUBJECT          string (mailto: — optional until Phase 7)
```
Push vars validated at runtime in `server.ts` (per rules.md §8: prod-only
requirements don't block dev boot).

### Route registration order (`app.ts`)
```
health → auth → pair → feed/posts → reactions → push → (404) → errorHandler
```
Specific before broad; auth-protected routers mount their middleware internally.

---

## 4. The seam — `@lovebook/core` types + `@lovebook/api` endpoints

### Replace `core/src/types/index.ts`
```ts
export type PostType = 'photo' | 'voice' | 'text';
export type PairStatus = 'pending' | 'active' | 'archived';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarKey: string | null;
  pairId: string | null;
  quietHours: QuietHours | null;
}
export interface QuietHours { start: string; end: string; tz: string }

export interface Pair {
  id: string;
  status: PairStatus;
  members: PairMember[];   // the other person's public profile + you
  createdAt: string;
}
export interface PairMember { id: string; name: string; avatarKey: string | null }

export interface Post {
  id: string;
  authorId: string;
  type: PostType;
  text: string | null;
  mediaKey: string | null;   // resolve via /posts media endpoint, never raw
  durationMs: number | null;
  reaction: Reaction | null; // the single reaction, if any
  createdAt: string;
}
export interface Reaction { emoji: string; reactorId: string; createdAt: string }

export interface Invite { code: string; pairId: string; expiresAt: string }
```
`ExampleItem` and `UserRole` deleted. (`role` dropped from `User` — LoveFeed has
no roles; admin-web is out of scope for v1 and can keep its own type if needed.)

### Replace `api/src/endpoints.ts` (`EP`)
```
HEALTH                api/v1/health

AUTH_REGISTER         api/v1/auth/register
AUTH_LOGIN            api/v1/auth/login
AUTH_REFRESH          api/v1/auth/refresh
AUTH_LOGOUT           api/v1/auth/logout
AUTH_ME               api/v1/auth/me

PAIR_CREATE_INVITE    api/v1/pair/invite           POST  → { code, pairId, expiresAt }
PAIR_INVITE_STATUS    api/v1/pair/invite/status    GET   (initiator polls)
PAIR_LOOKUP(code|id)  api/v1/pair/lookup/:ref      GET   (receiver previews initiator)
PAIR_CLAIM            api/v1/pair/claim            POST  { ref } → locks pair
PAIR_CURRENT          api/v1/pair                  GET   (active pair or null)
PAIR_LEAVE            api/v1/pair/leave            POST  → archives
PAIR_ARCHIVES         api/v1/pair/archives         GET   (past pairs, read-only)

FEED                  api/v1/feed                  GET   ?cursor= (cursor pagination)
POST_CREATE           api/v1/posts                 POST  { type, text? | mediaKey? + durationMs? }
POST_MEDIA(id)        api/v1/posts/:id/media       GET   → { uri } (signed view URL, pair-scoped)
MEDIA_UPLOAD_URI      api/v1/media/upload-uri      GET   ?ext= → proxied file-service upload uri

REACTION_SET(postId)  api/v1/posts/:id/reaction    PUT   { emoji } (upsert)
REACTION_CLEAR(postId)api/v1/posts/:id/reaction    DELETE

PUSH_SUBSCRIBE        api/v1/push/subscribe        POST  { endpoint, keys }
PUSH_UNSUBSCRIBE      api/v1/push/unsubscribe      POST  { endpoint }
PUSH_VAPID_KEY        api/v1/push/key              GET   → { key }

YEAR_REVIEW(pairId,yr)api/v1/pair/:id/review/:year GET   (Phase 8)
```

### Endpoint contracts (request → response envelope)

All success responses are `{ data: <T> }`; errors `{ error: { code, message, field_errors? } }`.

**`POST /auth/register`** `{ email, name, password }` →
`201 { data: { user: User, tokens: { access_token, refresh_token } } }`
Errors: `409 conflict` (email taken), `400 validation_error`.

**`POST /auth/login`** `{ email, password }` →
`200 { data: { user, tokens } }` · `401 unauthorized` (bad creds).

**`POST /auth/refresh`** `{ refresh_token }` →
`200 { data: { access_token, refresh_token } }` — **shape pinned by the existing
ky client refresh hook** (`client.ts` reads `res.data.access_token`). Must match.

**`GET /auth/me`** → `200 { data: User }` · `401`.

**`POST /pair/invite`** (auth) → `201 { data: { code, pairId, expiresAt } }`.
`409 conflict` if caller already in an active pair.

**`GET /pair/lookup/:ref`** (auth; ref = code or pairId) →
`200 { data: { initiator: PairMember, expiresAt } }` · `404 not_found` (bad/expired) ·
`410` (claimed/expired) — surfaced as `not_found` to avoid code enumeration.

**`POST /pair/claim`** (auth) `{ ref }` → `200 { data: Pair }` (now `active`).
`409` if claimer already paired; `404` invalid ref; `403` if claimer is the initiator.

**`GET /pair`** (auth) → `200 { data: Pair | null }`.

**`POST /pair/leave`** (auth) → `200 { data: { archivedPairId } }`. Notifies other member (push).

**`GET /feed`** (auth + pair) `?cursor=<id>&limit=20` →
`200 { data: { posts: Post[], nextCursor: string | null, hasMore: boolean } }`.
Cursor = the `_id` of the last post; query `{ pairId, _id < cursor }` sorted `_id desc`.

**`POST /posts`** (auth + pair) →
- text: `{ type:'text', text }` (≤200)
- photo: `{ type:'photo', mediaKey }`
- voice: `{ type:'voice', mediaKey, durationMs }` (≤30000)
→ `201 { data: Post }`. Triggers push to the other member (respecting quiet hours + 30s batch).

**`GET /posts/:id/media`** (auth + pair) → `200 { data: { uri, expiresIn } }`.
Backend verifies the post belongs to the caller's pair, then calls
file-service `/get-file-uri?key=<mediaKey>` and returns the signed URI. The raw
key never reaches the client. `403` if post not in caller's pair.

**`GET /media/upload-uri`** (auth + pair) `?ext=jpg|webm|...` →
`200 { data: { key, uri, expiresIn } }`. Proxies file-service `/get-upload-uri`.
Client PUTs directly to storage, then sends `key` back on `POST /posts`.

**`PUT /posts/:id/reaction`** (auth + pair) `{ emoji }` (must be in the 6) →
`200 { data: Reaction }` (upsert on `{postId, reactorId}`). `403` if not your pair.

**`DELETE /posts/:id/reaction`** → `204`.

**`POST /push/subscribe`** (auth) `{ endpoint, keys:{p256dh,auth} }` → `201`.

### Seam discipline (fullstack persona — verify before "done")
- Mongoose field names ↔ core TS field names match exactly.
- Nullable: Mongoose `null` ↔ core `field: T | null` (not optional `?` — we use
  explicit `| null` so `exactOptionalPropertyTypes` doesn't bite).
- Pagination: `nextCursor: string | null`, `hasMore: boolean` on both sides.
- Dates: backend sends ISO string, frontend never does math on a number.
- Arrays: empty feed returns `[]`, never `null`.
- Errors: frontend branches on `error.code`, never `error.message`.

---

## 5. The pairing state machine

```
                 POST /pair/invite
   (unpaired) ───────────────────────►  pair:pending + invite:live
                                              │
              ┌───────────────────────────────┤
              │ 24h elapse / cancel            │ POST /pair/claim (other user)
              ▼                                ▼
        invite:expired                   pair:active   (both users.pairId set)
        pair deleted                          │
        (initiator unpaired)                  │ POST /pair/leave (either user)
                                              ▼
                                        pair:archived
                                        both users.pairId = null
                                        (visible read-only in "Past pairs")
```

Invariants:
- A user has **at most one** non-archived pair at any time. `POST /pair/invite`
  and `POST /pair/claim` both `409` if the caller already has `pairId != null`.
- The initiator cannot claim their own invite (`403`).
- Locking the pair (claim) is the one transaction that must be atomic: set
  `pair.status=active`, `pair.memberIds=[a,b]`, both `users.pairId`, mark invite
  `claimed`. Use a Mongo transaction (replica set) **or** a guarded
  compare-and-set sequence with rollback. Documented in `pair.service.ts`.

---

## 6. Media flow (privacy-preserving proxy)

The file-service (`dockito/services/file-service-doc.md`) is a dumb signer: anyone
with a key can fetch a view URI. **Therefore our backend is the gate.**

Upload (photo/voice):
```
1. client → GET /media/upload-uri?ext=webm   (our backend, authed + paired)
2. our backend → file-service GET /get-upload-uri?ext=webm&prefix=lovef
3. backend returns { key, uri } to client
4. client PUTs the blob directly to `uri` (storage, 15-min window)
5. client → POST /posts { type:'voice', mediaKey: key, durationMs }
6. backend stores key on the post, scoped to pairId
```
View (in feed):
```
1. client → GET /posts/:id/media   (authed + paired)
2. backend loads post, asserts post.pairId === caller's pairId   ← the gate
3. backend → file-service GET /get-file-uri?key=<post.mediaKey>
4. backend returns { uri } (1-hour signed). client sets <img src>/<audio src>.
```
The client never sees another pair's keys, and the file-service is never reachable
with a key the caller wasn't authorized for. Satisfies PRD §10.

> Voice format: MediaRecorder → Opus/WebM (`ext=webm`). PRD mentions server-side
> MP3 transcode "if needed" — deferred; modern iOS/Android Safari play WebM/Opus
> in `<audio>`. Revisit only if cross-device playback fails QA.

---

## 7. Offline + PWA (Phase 6)

- `vite-plugin-pwa` (Workbox) generates the service worker + manifest.
- **App shell + static assets:** precache (cache-first).
- **Feed GET:** `NetworkFirst` with a cache fallback — recent posts visible offline.
- **Media view URIs:** not cached by SW (they expire); the *images* they point to
  cache via `CacheFirst` on the storage origin with a max-age + max-entries cap.
- **Outbox for new posts:** a queue in IndexedDB. Composing offline writes the
  draft (incl. the media blob) to the outbox and shows it optimistically with a
  `wait`-tone StatusPill ("queued"). A Workbox `BackgroundSync` queue (or a manual
  replay on `online`) uploads media → creates the post → reconciles the feed cache.
- **Manifest:** name "LoveFeed", standalone display, the plum theme color, maskable
  icons. iOS needs `apple-touch-icon` + the installed-to-home-screen path for push.

---

## 8. Push notifications (Phase 7)

- VAPID keys in env. `GET /push/key` exposes the public key to the client.
- Client subscribes via the SW's `pushManager`, POSTs the subscription.
- On `POST /posts`, backend enqueues a push to the **other** member:
  - Payload: `"<name> dropped a moment."` — **no content preview** (PRD §6).
  - **Quiet hours:** if now ∈ the recipient's window, defer delivery to the
    unmute time (a scheduled job / delayed queue), don't drop.
  - **Batching:** if the same author posts again within 30s, coalesce to
    `"<name> dropped N moments."` (debounce the send per author+recipient).
- Tapping opens the app to the feed (SW `notificationclick` → focus/open).
- iOS caveat repeated: only delivers on 16.4+ when installed to home screen.
  We test on real Android Chrome + iOS Safari before calling Phase 7 done (PRD §12).

---

## 9. Year-in-review (Phase 8 — deferrable)

Doesn't fire until day 365 of a pair. `GET /pair/:id/review/:year` aggregates:
photo/voice/text counts, longest consecutive-day streak, most-reacted post +
its emoji, a word-frequency cloud over text posts. Rendered on a shareable
card (the `Fraunces` display font + a screenshot-friendly layout). Built last;
zero impact on the core loop.

---

## 10. Build phases (each shippable + verifiable)

| Phase | Deliverable | Seam | Gate to pass |
|---|---|---|---|
| **0** | Cleanup: delete `example` (web+backend), replace core types, set `ROUTES`/`EP`, add `ServiceResult`, db/jwt/password libs, auth middleware, Mongo connect, env vars | core, api, backend infra | typecheck + lint green; server boots + connects to Mongo; health ok |
| **1** | Real **auth** — register/login/refresh/me/logout (bcrypt, JWT). Frontend: auth screens + provider + token wiring | full | contract test: register→login→me round-trips; refresh shape matches ky client |
| **2** | **Pairing** — invite/lookup/claim/leave/current/archives + state machine. Frontend pairing flow (primitives exist) | full | two seed users pair, lock, leave; can't double-pair; code expiry |
| **3** | **Feed + text posts** — cursor feed, create text post. Frontend feed screen + compose note | full | post appears top of feed; cursor paginates; pair-scoped (other pair can't read) |
| **4** | **Media posts** — upload-uri proxy, photo + voice create, media view gate. Frontend camera + MediaRecorder | full | upload→post→view round-trips; cross-pair media `403` |
| **5** | **Reactions** — set/clear, one-per-post unique. Frontend ReactionButton/Picker wired | full | tap default, long-press picker, re-tap replaces not duplicates |
| **6** | **PWA + offline** — SW, manifest, feed cache, compose outbox | frontend | installable; feed visible offline; queued post sends on reconnect |
| **7** | **Push** — VAPID, subscribe, post-triggers, quiet hours, batching | full | delivery on Android + iOS-installed; quiet hours defer; 30s batch |
| **8** | **Year-in-review** — aggregation + shareable card | full | aggregates correct on a seeded year-old pair |

At every full-stack phase: write the contract test at the seam first (personas),
produce the QA handoff docs (backend + frontend templates from the personas) into
`docs/qas/`, and run the Contract Drift checklist before marking done.

---

## 11. Open questions / risks

1. **Mongo transactions** need a replica set. Local dev: a single-node replica set
   (or the guarded CAS fallback in `pair.service.ts`). Confirm the deploy target's
   Mongo (Atlas = transactions available).
2. **iOS push** is the headline risk (PRD §12) — conditional and untestable without
   a real device installed to home screen. Phase 7 carries a "test on device" gate.
3. **Voice transcode** deferred; may resurface in Phase 4 QA if a device won't play
   WebM/Opus.
4. **admin-web** is out of v1 scope — it currently imports the `User` type. Phase 0
   keeps it compiling (local type or trimmed) without investing in it.
5. **Account deletion** (PRD §10: deletes your posts/reactions, the ex-partner keeps
   their archive copy) is specified but not in the phase table — slot into Phase 1's
   settings or a later pass. Flag for scoping.
</content>
</invoke>
