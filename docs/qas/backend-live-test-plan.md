# Backend Live Test Plan — lovebook (curl + mongosh, real bytes)

**Prepared:** 2026-06-13
**Method:** Real `curl` against the **running** backend, real `mongosh` against the
**real** database, real image/voice **bytes** PUT to the **real** file-service.
No supertest. No mocks. No stubs. This is the persona's Mode 2 done properly:
*"send the request, inspect the response, check the database, verify the side effects."*

> **Why this plan exists.** The first pass used `supertest` + in-memory Mongo +
> a stubbed file-service — i.e. in-code integration tests, the exact thing the QA
> persona distinguishes itself *from*. That proved the handlers' logic but never
> proved the system as a user hits it: a real token over the wire, a real photo
> uploaded to real storage and viewed back, real rows landing in the real Mongo.
> This plan tests the app **as if a couple were using it**.

---

## 0. Pre-flight (confirmed live at planning time)

| Dependency | State |
|---|---|
| Backend | `GET http://localhost:9092/api/v1/health` → **200** ✅ |
| File-service | `GET .../get-upload-uri?prefix=lovef&ext=jpg` → **200**, returns real presigned S3 PUT url ✅ |
| MongoDB | `mongosh --port 27017 lovebook` ping → **1** ✅, collections clean (0 docs) ✅ |

```bash
export BASE=http://localhost:9092/api/v1
export MDB="mongosh --quiet --port 27017 lovebook --eval"
curl -s $BASE/health | jq .          # expect {data:{status:"ok",...}}
```

If the backend is **not** running: `pnpm -F @lovebook/main-backend dev`.
The `.env` points at real Mongo (`127.0.0.1:27017/lovebook`) and the real
file-service — so every side effect below is inspectable in `mongosh`.

---

## 1. The user journey (the spine of the test)

Two real people: **Ada** invites, **Ben** joins. They share a feed, post a text,
a **real photo**, and a **real voice note**, react to each other, and one leaves.
Every step is a curl call whose response **and** database row I verify.

```
Ada registers → Ben registers
        → Ada creates invite (real 6-char code)
        → Ben previews the invite (sees Ada's name)
        → Ben claims it → pair LOCKS (verify both users.pairId in mongosh)
        → Ada posts a text → both see it in GET /feed
        → Ada uploads a REAL JPEG: upload-uri → PUT bytes to S3 → POST photo
                → Ben fetches GET /posts/:id/media → real signed view url
                → curl that url → bytes come back, same size as uploaded
        → Ben posts a REAL voice note (Opus/webm bytes), same chain
        → Ben reacts ❤️ to Ada's photo → Ada sees reaction in feed
        → Ada leaves → pair archives → Ben keeps read-only archive
```

This is the acceptance test. If this journey works on a real server with real
bytes, the product works. Everything else (§3–6) is the negative/edge surface.

---

## 2. Setup helpers (real curl, capture real tokens)

```bash
# Register Ada, capture her real access token from the real response
ADA=$(curl -s -X POST $BASE/auth/register -H 'Content-Type: application/json' \
  -d '{"email":"ada@live.test","name":"Ada","password":"Password123!"}')
ADA_T=$(echo "$ADA" | jq -r '.data.tokens.access_token')
ADA_ID=$(echo "$ADA" | jq -r '.data.user.id')

BEN=$(curl -s -X POST $BASE/auth/register -H 'Content-Type: application/json' \
  -d '{"email":"ben@live.test","name":"Ben","password":"Password123!"}')
BEN_T=$(echo "$BEN" | jq -r '.data.tokens.access_token')
BEN_ID=$(echo "$BEN" | jq -r '.data.user.id')

# Verify the rows actually exist in the real DB
$MDB "db.users.find({email:/live.test/},{email:1,name:1,pairId:1}).toArray()"
# expect: 2 users, pairId:null on both
```

---

## 3. Live test cases — happy path with DB verification

Each case: **curl** (assert status + body) → **mongosh** (assert the side effect).

| # | Step | curl | Assert response | Assert in mongosh |
|---|------|------|-----------------|-------------------|
| L-01 | Ada registers | `POST /auth/register` | 201, `data.tokens.access_token` is a real JWT | `db.users.countDocuments({email:"ada@live.test"})===1` |
| L-02 | Ben registers | `POST /auth/register` | 201 | user row exists, `pairId:null` |
| L-03 | Ada invites | `POST /pair/invite` (ADA_T) | 201, `code` is 6 chars `[A-Z2-9]`, `pairId` 24-hex, `expiresAt` ISO ~24h | `db.invites.findOne({status:"live"})` exists; `db.pairs.findOne({status:"pending"})` exists |
| L-04 | Ben previews | `GET /pair/lookup/<code>` (BEN_T) | 200, `initiator.name==="Ada"`, **no email** in payload | — |
| L-05 | Ben claims | `POST /pair/claim {ref:<code>}` (BEN_T) | 200, `status:"active"`, 2 members | **both** `users.pairId` now set to the pair `_id`; `invites` row `status:"claimed"`; `pairs` row `status:"active"` |
| L-06 | Ada posts text | `POST /posts {type:"text",text:"good morning ❤️"}` (ADA_T) | 201, `data.id` real, `type:"text"`, `text` echoed, `mediaKey:null` | `db.posts.findOne({})` has `pairId` == the pair, `authorId`==ADA_ID |
| L-07 | Ben reads feed | `GET /feed` (BEN_T) | 200, `posts[0].text==="good morning ❤️"`, `hasMore:false` | feed `pairId` scope matches |
| L-08 | **Ada uploads a REAL photo** | see §4 | bytes land in S3; `POST /posts {type:"photo",mediaKey:<key>}` → 201 | `db.posts` photo row, `mediaKey` set, `type:"photo"` |
| L-09 | **Ben views the photo** | `GET /posts/:id/media` (BEN_T) then `curl` the uri | 200 `{uri,expiresIn}`; the uri returns the **same bytes** Ada uploaded (byte count matches) | — (gate passed = pair membership verified) |
| L-10 | **Ben posts a REAL voice note** | §4 with webm/opus bytes + `durationMs` | 201, `durationMs` echoed, `type:"voice"` | voice post row in `db.posts` |
| L-11 | Ben reacts to Ada's photo | `PUT /posts/<photoId>/reaction {emoji:"❤️"}` (BEN_T) | 200, `emoji:"❤️"`, `reactorId`==BEN_ID | `db.reactions.countDocuments({postId})===1` |
| L-12 | Ada sees the reaction | `GET /feed` (ADA_T) | the photo post now has `reaction.emoji==="❤️"` | — |
| L-13 | Ben re-reacts 🔥 (replace) | `PUT .../reaction {emoji:"🔥"}` | 200, emoji now 🔥 | `db.reactions.countDocuments({postId})===1` (**still one**, replaced not added) |
| L-14 | Ada leaves | `POST /pair/leave` (ADA_T) | 200, `archivedPairId` | `pairs` row `status:"archived"`, `archivedAt` set; **both** `users.pairId:null` |
| L-15 | Ben keeps archive | `GET /pair/archives` (BEN_T) | 200, array contains the archived pair, members populated | — |
| L-16 | Ben's feed after leave | `GET /feed` (BEN_T) | 403 `forbidden` (unpaired again) | `users.pairId` null for Ben |

---

## 4. The real-media round-trip (the part that was stubbed before)

This is the flow the previous pass never actually ran. Three legs, all real:

```bash
# Leg 1 — ask our backend for a presigned upload target (real file-service proxy)
UP=$(curl -s "$BASE/media/upload-uri?ext=jpg" -H "Authorization: Bearer $ADA_T")
KEY=$(echo "$UP" | jq -r '.data.key')
PUT_URI=$(echo "$UP" | jq -r '.data.uri')
echo "key=$KEY"

# Leg 2 — PUT REAL BYTES straight to storage (a real image file)
#   make a real test jpeg if none handy:
#   (use any real .jpg; here we generate a tiny valid one)
curl -s -o /tmp/ada.jpg https://picsum.photos/200    # a real jpeg
SENT=$(wc -c < /tmp/ada.jpg)
curl -s -X PUT "$PUT_URI" --data-binary @/tmp/ada.jpg -H "Content-Type: image/jpeg" \
  -o /dev/null -w "upload status: %{http_code}\n"     # expect 200/204

# Leg 3 — create the post with the returned key, through our backend
POST=$(curl -s -X POST $BASE/posts -H "Authorization: Bearer $ADA_T" \
  -H 'Content-Type: application/json' -d "{\"type\":\"photo\",\"mediaKey\":\"$KEY\"}")
PID=$(echo "$POST" | jq -r '.data.id')

# Leg 4 — Ben views it through the access-gate, then fetches the actual bytes
VIEW=$(curl -s "$BASE/posts/$PID/media" -H "Authorization: Bearer $BEN_T")
VIEW_URI=$(echo "$VIEW" | jq -r '.data.uri')
curl -s "$VIEW_URI" -o /tmp/ben-got.jpg
GOT=$(wc -c < /tmp/ben-got.jpg)

# THE ASSERTION the old test could never make:
echo "sent=$SENT got=$GOT  $([ "$SENT" = "$GOT" ] && echo 'BYTES MATCH ✅' || echo 'MISMATCH ❌')"
# stronger: compare checksums
cmp -s /tmp/ada.jpg /tmp/ben-got.jpg && echo "identical content ✅"
```

**Voice note** repeats this with a real `.webm`/`.opus` blob and
`{"type":"voice","mediaKey":<key>,"durationMs":4200}`.

Cases:

| # | Test | Expected |
|---|------|----------|
| M-01 | upload-uri returns a real presigned PUT url | 200, `uri` is an `https` S3-style url, `key` prefixed `lovef-` |
| M-02 | PUT real jpeg bytes to that url | 200/204 from storage |
| M-03 | create photo post with the key | 201, `mediaKey` stored |
| M-04 | partner view-uri → fetch bytes | bytes returned **byte-identical** to what was uploaded (`cmp`) |
| M-05 | voice round-trip with real opus bytes | 201 + identical bytes back |
| M-06 | view-uri **without** the pair gate (3rd user) | 403 `forbidden` — gate holds on the real server |
| M-07 | view-uri for a text post (no media) | 404 `not_found` |

---

## 5. Live negative / edge cases (curl, real server)

The persona's auth playbook, run for real against the live server:

| # | Test | curl | Expected |
|---|------|------|----------|
| N-01 | No token | `GET /auth/me` | 401 `unauthorized` |
| N-02 | Expired token | `GET /auth/me` w/ a token minted `exp` in the past | 401 |
| N-03 | Tampered token (flip a char) | `GET /auth/me` | 401 |
| N-04 | Wrong password | `POST /auth/login` | 401 `unauthorized` |
| N-05 | Unknown email login | `POST /auth/login` | 401 (not 404 — no enumeration) |
| N-06 | Duplicate register | `POST /auth/register` (same email twice) | 2nd → 409 `conflict`; mongosh: still 1 user |
| N-07 | Claim own invite | Ada claims her own code | 403 `forbidden` |
| N-08 | Invite while paired | paired user `POST /pair/invite` | 409 `conflict` |
| N-09 | Feed/post while unpaired | solo user `GET /feed`, `POST /posts` | 403 `forbidden` |
| N-10 | Text > 200 chars | `POST /posts` 201-char text | 400 `validation_error` |
| N-11 | Voice durationMs 30001 | `POST /posts` | 400 |
| N-12 | Emoji outside the 6 | `PUT .../reaction {emoji:"👍"}` | 400 |
| N-13 | **Cross-pair feed leak** | pair X user reads, pair Y exists | pair Y posts **never** appear; verify in mongosh both pairs have distinct `pairId` |
| N-14 | Bogus tz (BUG-01 regression) | `PATCH /me {quietHours:{...,tz:"Not/Real"}}` | 400 `validation_error` (fixed) |
| N-15 | Concurrent invite (BUG-02 regression) | fire 2 `POST /pair/invite` with `&` in one shell | one live invite in mongosh; same code returned |
| N-16 | Rate limiting on login | 25× wrong-password `POST /auth/login` in a loop | **observe**: is there a 429 + `Retry-After`? (report finding — suspected absent) |

---

## 6. Cross-cutting, verified on real responses

| # | Check | How |
|---|-------|-----|
| X-01 | No secrets in any response | `grep -iE 'passwordHash\|password\|tokenVersion\|__v'` across every captured response body → empty |
| X-02 | Member shape carries no email | `GET /pair` members → no `@live.test` in payload |
| X-03 | Dates are ISO 8601 Z strings | regex on `expiresAt`, `createdAt`, `archivedAt` |
| X-04 | IDs are 24-hex | regex |
| X-05 | Error envelope on every 4xx | `{error:{code,message}}`, never a raw stack |
| X-06 | requestId echoed | `curl -i` → `x-request-id` header present |
| X-07 | DB is ground truth | after the full journey, `mongosh` counts reconcile: 2 users, 1 archived pair, N posts, reactions deduped |

---

## 7. Execution & teardown

1. Run §2 setup, then §3 L-01→L-16 in order (the journey), capturing every
   response to `/tmp/qa-live/*.json` for the report.
2. Run §4 media round-trip (the real-bytes proof).
3. Run §5 negatives and §6 cross-cutting.
4. **Teardown:** `mongosh --port 27017 lovebook --eval "db.dropDatabase()"` — or
   delete just the `*@live.test` users + their pairs/posts. (Uploaded blobs in the
   file-service expire on their own TTL.)
5. Produce a **live execution report**: every case PASS/FAIL with the **actual
   curl output and mongosh row** pasted in as evidence — not "the assertion
   passed" but "here is the 200 body and here is the DB row it created."

---

## 8. What this plan proves that the last one didn't

| | Old (supertest + in-memory + stub) | This plan (curl + real Mongo + real bytes) |
|---|---|---|
| Token over the wire | minted in-process | real `Authorization: Bearer` header on a real HTTP request |
| Database | ephemeral in-memory mongod | the real `lovebook` Mongo, rows inspected by hand |
| Photo upload | `fetch` stubbed, fake key | **real JPEG PUT to real S3, fetched back, bytes compared** |
| Voice note | not done | **real opus blob round-trip** |
| "Does the feed actually show the post?" | asserted on a mock response | curled on the live server, post visible to the partner |
| Evidence | green checkmarks | actual response bodies + DB rows in the report |

---

## 9. Out of scope (unchanged, still true)

- Frontend UI (Phase 2 — including the `use-recorder.ts` voice capture).
- Real web-push delivery to a browser endpoint (VAPID unset).
- Magic-link sign-in; year-in-review (cut).
