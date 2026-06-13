# lovebook — API Reference (v1)

**Base URL:** `http://localhost:9092`  ·  All paths prefixed `/api/v1`
**Auth:** `Authorization: Bearer <access_token>` (JWT). Access ~15m, refresh ~30d.
**Envelope:** success `{ "data": <T>, "meta"?: {...} }` · error `{ "error": { "code", "message", "field_errors"? } }`
**Error codes:** `validation_error` (400) · `unauthorized` (401) · `forbidden` (403) · `not_found` (404) · `conflict` (409) · `rate_limited` (429) · `internal` (500)

Frontends reach these via the `EP` constants in `@lovebook/api`; request bodies
are validated against the shared Zod schemas in `@lovebook/core` (single source).

---

## Conventions

- **IDs** are 24-char Mongo ObjectId hex strings.
- **Dates** are ISO 8601 strings.
- **Nullable** fields are `null` (never omitted) — e.g. `avatarKey`, `pairId`, `reaction`.
- **Pagination** is cursor-based on post `_id` (newest first). Never offset.
- **Validation errors** carry `field_errors: { <path>: string[] }`.

---

## Auth

### `POST /auth/register`
Body: `{ "email": string, "name": string (1–60), "password": string (8–200) }`
→ **201** `{ data: { user: User, tokens: { access_token, refresh_token } } }`
Errors: `409 conflict` (email taken), `400 validation_error`.

### `POST /auth/login`
Body: `{ "email": string, "password": string }`
→ **200** `{ data: { user, tokens } }` · `401 unauthorized` (bad credentials).

### `POST /auth/refresh`
Body: `{ "refresh_token": string }`
→ **200** `{ data: { access_token, refresh_token } }` · `401`.
> Shape pinned by the `@lovebook/api` ky client refresh hook — do not change.

### `POST /auth/logout`
→ **204**. (Stateless JWT; client drops its tokens.)

### `GET /auth/me`  · _auth_
→ **200** `{ data: User }` · `401`.

**`User`:** `{ id, email, name, avatarKey: string|null, pairId: string|null, quietHours: {start,end,tz}|null }`

---

## Settings

### `PATCH /me`  · _auth_
Body (≥1 field): `{ "name"?: string, "avatarKey"?: string|null, "quietHours"?: {start:"HH:mm", end:"HH:mm", tz:string}|null }`
→ **200** `{ data: User }` · `400` (empty body / bad time format).

### `DELETE /me`  · _auth_
Deletes the account: removes the user's own posts, reactions, and push
subscriptions. If in an active pair, archives it so the partner keeps a
read-only copy (PRD §10) and is returned to unpaired.
→ **204**.

---

## Pairing

State machine: `unpaired → POST /pair/invite → pending → POST /pair/claim → active → POST /pair/leave → archived`.
Invariant: a user holds **at most one** non-archived pair.

### `POST /pair/invite`  · _auth_
→ **201** `{ data: { code: string (6 char A–Z0–9), pairId: string, expiresAt: ISO } }`
Errors: `409 conflict` (already paired). Re-invite returns the existing live code.

### `GET /pair/lookup/:ref`  · _auth_
`ref` = invite code **or** pairId (the shareable link). Receiver previews the initiator.
→ **200** `{ data: { initiator: { id, name, avatarKey }, expiresAt } }`
Errors: `404 not_found` (bad/expired/claimed — never distinguished, to prevent enumeration).

### `POST /pair/claim`  · _auth_
Body: `{ "ref": string }`. Locks the pair (atomic).
→ **200** `{ data: Pair }` · `409` (claimer already paired) · `403` (claiming own invite) · `404` (bad ref).

### `GET /pair`  · _auth_
→ **200** `{ data: Pair | null }` (the caller's active pair).

### `POST /pair/leave`  · _auth_
Archives the active pair; both members become unpaired.
→ **200** `{ data: { archivedPairId: string } }` · `404` (no active pair).

### `GET /pair/archives`  · _auth_
→ **200** `{ data: Pair[] }` (read-only past pairs, newest first).

**`Pair`:** `{ id, status: 'pending'|'active'|'archived', members: [{id,name,avatarKey}], createdAt, archivedAt: ISO|null }`

---

## Feed + posts  · _auth + pair (403 if unpaired)_

### `GET /feed?cursor=<id>&limit=<1–50>`
→ **200** `{ data: { posts: Post[], nextCursor: string|null, hasMore: boolean } }`
First page omits `cursor`. Pass `nextCursor` for the next page. Newest first.

### `POST /posts`
Discriminated by `type`:
- `{ "type": "text", "text": string (1–200) }`
- `{ "type": "photo", "mediaKey": string }`
- `{ "type": "voice", "mediaKey": string, "durationMs": int (1–30000) }`
→ **201** `{ data: Post }`. Enqueues a push to the other member.
Errors: `400 validation_error` (over limits / wrong shape), `403` (unpaired).

### `GET /posts/:id/media`
The access gate: verifies the post is in the caller's pair, then mints a signed
view URL from the file-service.
→ **200** `{ data: { uri: string, expiresIn: string } }` · `403` (not your pair) · `404` (no media).

**`Post`:** `{ id, authorId, type, text: string|null, mediaKey: string|null, durationMs: number|null, reaction: Reaction|null, createdAt }`

---

## Reactions  · _auth + pair_

### `PUT /posts/:id/reaction`
Body: `{ "emoji": "❤️"|"😂"|"😭"|"🎉"|"🔥"|"⚡" }`. Upsert — one reaction per
person per post; a re-tap replaces, never duplicates.
→ **200** `{ data: Reaction }` · `400` (emoji not in set) · `403` (not your pair) · `404`.

### `DELETE /posts/:id/reaction`
→ **204**.

**`Reaction`:** `{ emoji: string, reactorId: string, createdAt }`

---

## Media

### `GET /media/upload-uri?ext=<alphanumeric>`  · _auth + pair_
Proxies a presigned upload target from the file-service. The client PUTs bytes
directly to `uri`, then sends `key` back via `POST /posts`.
→ **200** `{ data: { key: string, uri: string, expiresIn: string } }`.

> The raw file-service is never exposed to the client for *viewing* — view URLs
> are always minted behind the pair-membership gate at `GET /posts/:id/media`.

---

## Push

### `GET /push/key`  · _public_
→ **200** `{ data: { key: string | null } }` (VAPID public key; `null` if unconfigured).

### `POST /push/subscribe`  · _auth_
Body: `{ "endpoint": string (url), "keys": { "p256dh": string, "auth": string } }`
→ **201** `{ data: { ok: true } }`. Upserts by endpoint.

### `POST /push/unsubscribe`  · _auth_
Body: `{ "endpoint": string }` → **200** `{ data: { ok: true } }`.

**Notification on post:** `"<name> dropped a moment"` (no content preview). Skipped
while the recipient is within their quiet-hours window. The SW collapses rapid
notifications via a shared `tag` (30s batch effect).

---

## Health

### `GET /health`  · _public_
→ **200** `{ data: { status: "ok", service, env, time } }`.
