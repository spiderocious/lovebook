# Backend Live Execution Report — lovebook (curl + mongosh + real bytes)

**Date:** 2026-06-13
**Plan:** [backend-live-test-plan.md](./backend-live-test-plan.md)
**Method:** Real `curl` against the running server (`localhost:9092`), real `mongosh`
against the real `lovebook` Mongo (`127.0.0.1:27017`), real image/voice **bytes**
PUT to the **real** file-service. No supertest, no mocks, no stubs.

**Pre-flight:** health → 200 ✅ · file-service `/get-upload-uri` → 200 (real presigned
S3 url) ✅ · mongod ping → 1 ✅.

---

## Summary

| Group | Result |
|-------|--------|
| User journey (L-01 … L-16) | **16 / 16 PASS** |
| Real media round-trip (M-01 … M-07) | **7 / 7 PASS** |
| Negatives / edges (N-01 … N-16) | **PASS** (1 test-payload correction, 1 risk confirmed) |
| Cross-cutting on real responses (X) | **PASS** |
| Bug regressions (BUG-01, BUG-02) | **both confirmed fixed, live** |

**Headline:** the product works as a couple would use it. Two real users
registered, paired, posted a text + a **real photo** + a **real voice note**,
viewed each other's media byte-for-byte, reacted, and one left — every step
verified against the real database. The two earlier bugs stay fixed under real
HTTP + real concurrency. One risk reconfirmed: **no rate limiting on login.**

---

## The user journey — real curl, real DB rows

| # | Step | Result | Evidence (live) |
|---|------|--------|-----------------|
| L-01 | Ada registers | PASS | 201; real 3-part JWT; `db.users` row, `pairId:null`; response carries **no** passwordHash; DB stores a real `$2b$` bcrypt hash |
| L-02 | Ben registers | PASS | 201; second user row |
| L-03 | Ada invites | PASS | code `L2BDM5` (6× `[A-Z2-9]`), `expiresAt` +24h ISO; `db.invites` status `live`, `db.pairs` status `pending` |
| L-04 | Ben previews invite | PASS | `initiator.name:"Ada"`, `avatarKey:null`, **no email** in payload |
| L-05 | Ben claims → lock | PASS | `status:"active"`, members `[Ada,Ben]`; DB: invite→`claimed`, pair→`active`, **both** `users.pairId` = pair id, `memberIds.length===2` |
| L-06 | Ada posts text | PASS | 201 `{type:text, text:"good morning ❤️", mediaKey:null}`; `db.posts` row scoped to the pair, `authorId`=Ada |
| L-07 | Ben reads feed | PASS | `posts[0].text==="good morning ❤️"`, `hasMore:false`, `nextCursor:null` |
| L-08 | Ada uploads real photo | PASS | see M-01…M-03 |
| L-09 | Ben views the photo | PASS | see M-04 — **bytes identical** |
| L-10 | Ben posts real voice note | PASS | real WebM/Opus (ffmpeg), 13 466 bytes; `type:voice, durationMs:3000` |
| L-11 | Ben reacts ❤️ | PASS | `reactorId`=Ben; `db.reactions` count = 1 |
| L-12 | Ada sees reaction | PASS | feed shows the photo post with `reaction.emoji:"❤️"` |
| L-13 | Ben re-reacts 🔥 (replace) | PASS | `emoji:🔥`; DB **still count = 1** (replaced, not duplicated) |
| L-14 | Ada leaves | PASS | `archivedPairId` returned; DB: pair `archived` + `archivedAt` set; **both** `pairId:null` |
| L-15 | Ben keeps archive | PASS | `GET /pair/archives` → 1 archived pair, members `[Ada,Ben]`, `archivedAt` ISO |
| L-16 | Ben's feed after leave | PASS | `GET /feed` → **403** (unpaired again) |

---

## Real media round-trip — the part that was stubbed before

This is the flow the previous (supertest) pass never actually executed. All real.

| # | Test | Result | Evidence |
|---|------|--------|----------|
| M-01 | upload-uri → presigned PUT url | PASS | `key:"lovef-ef3156e4-….jpg"`, real `https://t3.storageapi.dev/...` S3 url, `expiresIn:"15m"` |
| M-02 | PUT real jpeg bytes to storage | PASS | real 300×200 JPEG, **10 350 bytes**, storage returned **200** |
| M-03 | create photo post with key | PASS | 201, `type:photo`, `mediaKey` stored |
| M-04 | partner view-uri → fetch bytes | **PASS** | Ben's view url returned the bytes; **`sent=10350 got=10350`, `cmp` identical, same SHA `f75f452ee18e`** |
| M-05 | voice round-trip (real opus) | **PASS** | Ben uploads 13 466-byte WebM; Ada fetches back — **byte-identical** |
| M-06 | unpaired 3rd user view-uri | PASS | Carol (no pair) → **403** `forbidden` |
| M-07 | view-uri for a text post | PASS | **404** `not_found` |

> **M-04 is the assertion the stubbed test could never make:** a real image
> uploaded to real storage and fetched back through the pair-membership gate,
> proven byte-for-byte identical by checksum.

---

## Negative / edge cases — live curl

| # | Test | Result | Notes |
|---|------|--------|-------|
| N-01 | No token | PASS | 401 `unauthorized` ("Missing bearer token") |
| N-03 | Tampered token | PASS | 401 |
| N-04 | Wrong password | PASS* | *first attempt sent a 5-char password → 400 at validation (password.min(8)) **before** credential check. With a valid-length wrong password → **401 `unauthorized`, "Invalid email or password"**. Correct — not a bug; my initial payload was malformed. |
| N-05 | Unknown email | PASS | 401, **same message** as wrong-password → no account enumeration |
| N-06 | Duplicate register | PASS | 409 `conflict`; DB still 1 user |
| N-07 | Claim own invite | PASS | 403 `forbidden` |
| N-08 | Invite while paired | PASS | 409 `conflict` |
| N-10 | Text > 200 chars | PASS | 400 `validation_error` |
| N-11 | Voice durationMs 30001 | PASS | 400 |
| N-12 | Emoji outside the 6 (👍) | PASS | 400 |
| N-13 | **Cross-pair leak** | **PASS** | Two real pairs. Gus (pair 2) feed = **0 posts**, pair-1's "secret" text absent; direct `GET /posts/<pair-1>/media` → **403**; `PUT reaction` on pair-1 post → **403**. Isolation holds on the live server. |
| N-14 | Bogus tz (BUG-01) | **PASS** | `tz:"Not/Real"` → **400 `validation_error`**; valid `Africa/Lagos` → 200. Fix holds live. |
| N-15 | Concurrent invite (BUG-02) | **PASS** | Two simultaneous `POST /pair/invite` → **same code `6TDEKJ`** to both; DB: **1** live invite, **1** pending pair. Fix holds under real concurrency. |
| N-16 | Rate limiting on login | **RISK** | 25 rapid wrong-password attempts → all answered normally, **no 429, no `Retry-After`**. Login brute-force is unbounded this phase. |

---

## Cross-cutting (verified on real responses)

| # | Check | Result |
|---|-------|--------|
| X-01 | No secrets in any captured response | PASS — grep of all `/tmp/qa-live/*.json` for `passwordHash`/`tokenVersion`/`__v`/`password` → none |
| X-02 | Member shape carries no email | PASS — `GET /pair` members had no `@live.test` |
| X-03 | Dates ISO 8601 Z | PASS — e.g. `"expiresAt":"2026-06-14T13:24:27.773Z"` |
| X-05 | Error envelope on 4xx | PASS — `{"error":{"code":"unauthorized","message":"Missing bearer token"}}` |
| X-06 | requestId header | PASS — `x-request-id: e7c3da40d97b1978ce03988b` on a real 401 |
| X-07 | DB reconciles post-journey | PASS — 2 archived pairs, reactions deduped (1 per post per reactor) |

---

## Findings

### No new bugs.
The live run found **no new defects**. The one initial surprise (N-04 returning
400) was a **malformed test payload** (5-char password tripping `min(8)` before
the credential check), not an API fault — confirmed by re-running with a valid
wrong password (correct 401).

### Risk reconfirmed (not new): no login rate limiting.
N-16: 25 rapid failed logins drew no `429`/`Retry-After`. Brute-force on
`/auth/login` is unbounded. **Recommend** an IP/email rate limiter with
`Retry-After` for Phase 2. (Also still open: stateless logout doesn't revoke.)

### Both prior bugs verified fixed on the live server.
- **BUG-01** (invalid tz): now 400 at the write path — N-14.
- **BUG-02** (concurrent invite duplicate): now 1 invite / 1 pending pair under a
  real same-user race — N-15.

---

## How this run differs from the first (supertest) pass

| | First pass | This run |
|---|---|---|
| Transport | in-process supertest | **real HTTP** `curl` with `Authorization: Bearer` over the wire |
| Database | ephemeral in-memory mongod | **real `lovebook` Mongo**, rows inspected by hand with `mongosh` |
| Photo upload | `fetch` stubbed, fake key | **real JPEG → real S3 PUT (200) → fetched back → bytes byte-identical (SHA match)** |
| Voice note | not exercised | **real WebM/Opus round-trip, byte-identical** |
| "Feed shows the post?" | asserted on a mock | **curled on the live server, partner sees it** |
| Cross-pair leak | mocked pair ids | **two real pairs; pair-2 user provably can't see/touch pair-1 data** |

---

## Teardown

All `*@live.test` data removed from the real DB: **8 users, 4 pairs, 4 invites,
4 posts, 1 reaction deleted; 0 `live.test` users remain.** Uploaded blobs expire
on the file-service's own TTL. Evidence artifacts (`/tmp/qa-live/*.jpg`,
`*.webm`, `*.json`) retained.

## Reproduce

```bash
export BASE=http://localhost:9092/api/v1
# register two users, capture tokens with jq, invite/claim, post, then:
#   upload-uri → PUT real bytes → POST photo → partner view-uri → curl → cmp
# full command sequence is in backend-live-test-plan.md §2–§4.
```
