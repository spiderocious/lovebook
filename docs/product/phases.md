# lovebook — Build Phases

The ordered plan. **Backend is built once and complete (Phase 1); the frontend
is built progressively on top of that stable API (Phases 2+).** Phase 0 is the
foundation. Phases are sequential; we pause for review after each.

Why this order: the backend is the contract everything else stands on. Once the
whole API exists and is contract-tested, each frontend slice is small, isolated,
and **testable against a real running backend** — no stubbing, no half-built
endpoints. We're **not touching design** in these phases — frontend slices consume
the existing `@lovebook/ui` primitives as-is (PolaroidMoment, VoiceMoment,
ComposeBar, ReactionPicker, InviteCodeEntry, the four-font system, Lamplight dark
mode); the design system is already built and is out of scope here.

See the full architecture in [lovebook-plan.md](../lovebook-plan.md). Quick recap:

- **Monorepo:** this TS pnpm/Nx template. Backend = Express `main-backend`.
- **Product:** a two-person ambient feed. Two users pair; each is in exactly one
  pair. Both see one shared reverse-chron feed of moments. Three post types —
  **photo, voice note (≤30s), one-line text (≤200 chars)**. One reaction per post
  (default ❤️, long-press for 6 alternatives). No replies, no metrics, no third
  user. **Push when the other person posts.** The product's personality is what it
  doesn't have — resist adding features.
- **PWA from day one:** `apps/web` is the installable app. Service worker, offline
  feed cache, and a compose **outbox** are foundational, not a bolt-on — wired in
  Phase 0 and exercised from the first frontend slice onward.
- **Database:** MongoDB via **Mongoose behind hand-written Repository ports** —
  services depend on interfaces, Mongoose never leaks into business logic; swapping
  DB later = new adapter. Tests use `mongodb-memory-server`.
- **Validation:** **Zod end-to-end** — one schema source in `@lovebook/core` feeds
  frontend types + backend boundary parsing.
- **Storage:** photos + voice notes via the external file-service
  (`go-file-service-production.up.railway.app`). Frontend uploads direct via
  presigned URI; **backend stores only the file `key`** (never the URI, never bytes)
  and is the **access-control gate** — it verifies the caller is in the post's pair
  before minting a signed view URL, so the dumb signer never leaks across pairs.
- **Auth:** real accounts, email/password + JWT (template auth built out). Magic
  link is a reserved seam, not built now.
- **Push:** **Web Push (VAPID) + service worker** — subscription endpoint and
  send-on-post built in the backend phase, wired in the frontend. Respects quiet
  hours and 30s batching. iOS 16.4+ home-screen-installed only (known risk).
- **HTTP:** ky client (`@lovebook/api`) + TanStack Query for cache/state.
- **Year-in-review:** **out of scope.** Not built.

---

## Phase 0 — Foundation

**Goal:** turn the template placeholders into the lovebook project and stand up the
shared seams the backend will build on — including the **PWA shell** — so Phase 1
starts on clean ground. _(Package scope `@lovebook/*` already matches the product —
no rebrand needed.)_

**Scope:**
- Delete placeholders: `example` feature (backend + web), `User` / `ExampleItem`
  stub types, `ROUTES.EXAMPLE*` / `ROUTES.DASHBOARD` etc., `EP.EXAMPLE*`,
  placeholder home/website copy.
- `@lovebook/core`: Zod schemas + inferred types for the domain (`User`, `Pair`,
  `Invite`, `Post`, `Reaction`, `QuietHours`, `PushSubscription`) — one source feeding
  both sides; real `ROUTES` (landing, auth, pair, feed, settings, past-pairs); the
  allowed-reactions set and post limits (200 chars / 30s) as shared constants.
- DB: wire **MongoDB + Mongoose** with Repository **ports** (`UserRepo`, `PairRepo`,
  `InviteRepo`, `PostRepo`, `ReactionRepo`, `PushRepo`) and their Mongo adapter impls;
  Mongo connection + `MONGODB_URI` in `env.ts`; `mongodb-memory-server` for tests.
- Storage: `FileService` client (presigned-URL flow) in `@lovebook/api`;
  `FILE_SERVICE_BASE_URL` in `env.ts`.
- Push: `web-push` dependency + `VAPID_*` env (validated at runtime in `server.ts`,
  not blocking dev boot); `lib/push.ts` sender stub.
- **PWA shell (`apps/web`):** `vite-plugin-pwa` (Workbox), `manifest.webmanifest`
  (name "lovebook", standalone, plum theme color, maskable + `apple-touch-icon`
  icons), service-worker registration, and the offline scaffolding — feed cache
  strategy and the IndexedDB **outbox** module (empty queue, wired but unused until
  there are posts to queue).
- `pnpm install` to refresh the lockfile.

**Surfaces:** `@lovebook/core`, `@lovebook/api`, `main-backend` (DB + infra only),
`apps/web` (PWA shell only).

**Done when:**
- [ ] No `example` / `ExampleItem` / `DASHBOARD` placeholder references remain.
- [ ] Mongo connects; Repository ports + Mongo adapters typecheck.
- [ ] `FileService` client compiles against the documented file-service contract.
- [ ] `apps/web` installs as a PWA (manifest valid, SW registers); app shell loads
      offline; the outbox module is present and typechecks.
- [ ] `pnpm exec nx run-many -t typecheck` and `-t build` pass.

---

## Phase 1 — The entire backend (built once, contract-tested)

**Goal:** implement **every endpoint the whole product needs**, in one phase, behind
the Repository ports with Zod validation and contract tests. After this, the API
is complete and stable; all frontend phases build against a real running backend.

**Scope — all routes (`asyncHandler` + `ResponseUtil` + Zod + ports, registered in
order in `app.ts`):**

- **Auth:** `POST /auth/register | login | refresh | logout`, `GET /auth/me`. JWT
  access/refresh, bcrypt password hashing, auth middleware. _(Refresh returns
  `{ data: { access_token, refresh_token } }` — shape pinned by the existing ky
  client.)_ Magic-link endpoints stubbed, not built.
- **Pairing:** `POST /pair/invite` (mint a 6-char code + a `pairId` link; 24h TTL),
  `GET /pair/lookup/:ref` (receiver previews the initiator by code or id),
  `POST /pair/claim` (lock the pair — atomic), `GET /pair` (current active pair or
  null), `POST /pair/leave` (archive), `GET /pair/archives` (read-only past pairs).
  Enforces the state machine (`pending → active → archived`) and the
  one-active-pair-per-user invariant.
- **Feed + posts:** `GET /feed?cursor=&limit=` (**cursor pagination on `_id`**,
  pair-scoped), `POST /posts` (`text` ≤200 | `photo` mediaKey | `voice` mediaKey +
  `durationMs` ≤30000). Posts are immutable. Creating a post enqueues a push to the
  other member.
- **Media:** `GET /media/upload-uri?ext=` (proxies file-service upload URI),
  `GET /posts/:id/media` (the **access gate** — asserts the post is in the caller's
  pair, then returns a signed view URI).
- **Reactions:** `PUT /posts/:id/reaction` (upsert — unique on `{postId, reactorId}`,
  one per person), `DELETE /posts/:id/reaction`.
- **Settings:** `PATCH /me` (display name, avatar key, quiet hours), account
  deletion (`DELETE /me` — removes the user's posts/reactions; the ex-partner keeps
  their archive copy, per PRD §10).
- **Push:** `GET /push/key` (VAPID public key), `POST /push/subscribe`,
  `POST /push/unsubscribe`. Send-on-post respects **quiet hours** (defer to unmute,
  don't drop) and **30s batching** (`"<name> dropped N moments"`, no content preview).

**Cross-cutting:**
- All bodies/responses validated by the shared `@lovebook/core` Zod schemas.
- **Contract test per handler** (parse the response through the shared schema; assert
  no throw) — the most valuable tests at the seam.
- Integration tests via `mongodb-memory-server`, truncating collections between tests.
- The atomic pair-lock (Mongo transaction or guarded compare-and-set) proven here.

**Surfaces:** `main-backend`, `@lovebook/core`, `@lovebook/api` (types/EP).

**Done when (testable as an API — REST client / test suite, no UI):**
- [ ] Every endpoint returns the documented shape; auth gates the authed routes;
      pair membership gates the feed/post/reaction/media routes.
- [ ] Full happy path via a REST client: register/login two users → A mints an invite
      → B claims → pair active → A posts text → `GET /feed` shows it for both →
      B reacts → A leaves → pair archived, both unpaired.
- [ ] Media loop via REST client: `GET /media/upload-uri` → PUT a blob to storage →
      `POST /posts` with the key → `GET /posts/:id/media` returns a view URI; a user
      from a different pair gets `403`.
- [ ] Cursor pagination is offset-free and stable; cross-pair reads `403`.
- [ ] Contract + integration tests green; typecheck + lint + build pass.
- [ ] **Backend QA handoff** doc produced (endpoints, the pairing state machine,
      RBAC/pair-scoping, edge cases, seed users).

---

## Phase 2 — Frontend: auth

**Goal:** first frontend slice. A new user signs up / logs in against the real
backend and lands on the (empty) "pair with someone" screen. _(Uses existing
`@lovebook/ui` primitives — no design work.)_

**Scope (`apps/web` + `@lovebook/api`):**
- Auth react-query hooks (`useLogin`, `useRegister`, `useMe`) hitting `EP.AUTH_*`.
- Token storage + ky 401-refresh wired; `AuthProvider` (Context + `useState`).
- Landing screen (one-sentence pitch + "Get started"); login + signup screens;
  `AuthGuard`; logout.
- The authed shell renders `GET /auth/me` and routes an unpaired user to the
  "pair with someone" empty state (built in Phase 3).

**Done when (test by hand):**
- [ ] Sign up a fresh user and log in; protected routes gated; refresh keeps the
      session alive across reload (and offline-then-online); logout clears it.
- [ ] Typecheck + build pass.

---

## Phase 3 — Frontend: pairing

**Goal:** two users pair with each other and land in their shared (empty) feed.

**Scope (`apps/web` + `@lovebook/api`):**
- Pairing hooks (`useCreateInvite`, `useInviteLookup`, `useClaimPair`, `usePair`,
  `useLeavePair`, `useArchives`).
- **Initiator flow:** "Invite someone" → shows the 6-char code + shareable
  `feed.app/pair/<pairId>` link (using `InviteCodeDisplay`, copy button) → "waiting
  to be claimed" live state (polls `GET /pair`).
- **Receiver flow:** open the link or "Enter an invite code" (`InviteCodeEntry`) →
  confirmation screen ("[name] wants to pair with you") → claim → both see "Paired
  with [name] · Welcome to your space" → empty feed.
- **Leave pair** in settings (`HoldToConfirmButton` + confirmation) → returns to the
  empty "pair with someone" state; "Past pairs" read-only list.

**Done when (test by hand):**
- [ ] User A mints an invite; User B claims via code and via link; both land paired.
- [ ] Can't double-pair; expired/claimed code shows a clean message; initiator can't
      claim their own.
- [ ] Leaving archives the pair; both return to empty state; archive shows read-only.
- [ ] Typecheck + build pass.

---

## Phase 4 — Frontend: the feed + text posts ← the heart

**Goal:** the core daily loop, simplest post type first. A paired user writes a
one-line note and it appears at the top of the shared feed — and the feed works
offline.

**Scope (`apps/web` + `@lovebook/api`):**
- Feed hook (`useFeed` cursor list) + the **vertical feed screen** (top bar with
  wordmark + connection dot + settings gear; `PostcardMoment` cards;
  human-readable timestamps; reverse-chron; infinite scroll on the cursor).
- **Compose — note** via `ComposeBar` (the pencil door) + `LineField` (200-char
  counter): `useCreatePost` → optimistic insert at top.
- **Offline:** feed renders from the SW cache when offline; a composed note while
  offline goes to the **outbox** (shown with a `wait`-tone "queued" pill) and sends
  on reconnect, then reconciles into the feed cache.

**Done when (test by hand):**
- [ ] Write a note → it appears at the top instantly and persists after reload.
- [ ] Feed is visible offline (recent posts cached); a note composed offline queues
      and sends when back online.
- [ ] The other paired user sees the note at the top of their feed; a different pair
      cannot.
- [ ] Cursor pagination scrolls smoothly; typecheck + build pass.

---

## Phase 5 — Frontend: photo + voice posts

**Goal:** the other two doors. Round out compose with photo and voice, through the
media gate, including offline queueing of media.

**Scope (`apps/web` + `@lovebook/api`):**
- **Photo door:** `ComposeBar` camera → device camera (`getUserMedia` / file input)
  → preview (`PolaroidMoment`-style) with **Send / Retake** (no filters, no crop,
  no caption — the photo is the post) → upload via `GET /media/upload-uri` → PUT to
  storage → `POST /posts` with the key.
- **Voice door:** `ComposeBar` mic → hold-to-record (`MediaRecorder`, Opus/WebM,
  hard stop at 0:30) using `VoiceRecorder` → preview → Send / Retake → same upload
  flow with `durationMs`.
- **Media render in feed:** `VoiceMoment` (waveform + play) and `PolaroidMoment`
  resolve their image/audio via `GET /posts/:id/media` (signed view URI), cached on
  the storage origin by the SW.
- **Offline media:** queued photo/voice (blob in the outbox) uploads + posts on
  reconnect.

**Done when (test by hand):**
- [ ] Take a photo → preview → send → it renders in both users' feeds.
- [ ] Record a voice note (capped at 30s) → preview → send → plays back in the feed.
- [ ] A photo/voice composed offline queues and completes on reconnect.
- [ ] Cross-pair media access returns `403` (the gate holds); typecheck + build pass.

---

## Phase 6 — Frontend: reactions

**Goal:** the one allowed response. A user reacts to a post — once.

**Scope (`apps/web` + `@lovebook/api`):**
- `ReactionButton` on each card: tap leaves the default ❤️; long-press opens
  `ReactionPicker` (the 6 alternatives). `useSetReaction` (upsert) /
  `useClearReaction`.
- The card shows the **single** reaction the other person left (or empty). Re-tap
  replaces, never duplicates. Optimistic update.

**Done when (test by hand):**
- [ ] Tap to leave ❤️; long-press to pick another; re-tapping changes the emoji (no
      second reaction appears).
- [ ] The other user sees the reaction on their card; clearing removes it.
- [ ] Typecheck + build pass.

---

## Phase 7 — Frontend: push + settings

**Goal:** close the loop — the other person gets notified, and per-user settings
(profile, quiet hours) work.

**Scope (`apps/web` + `@lovebook/api`):**
- **Push opt-in:** request permission, subscribe via the SW `pushManager`, POST the
  subscription (`GET /push/key` → `POST /push/subscribe`). `notificationclick` opens
  the feed with the new post at top.
- **Settings screen:** display name, avatar upload (file-service flow),
  **quiet hours** window (`TimeField` + `Switch` / `SettingRow`), email/password
  management, sign out, account deletion (`DELETE /me`, `HoldToConfirmButton`).
- Verify quiet-hours defer + 30s batching end-to-end with the backend.
- **Device testing:** real Android Chrome + iOS Safari (installed to home screen) —
  the iOS push gate (PRD §12).

**Done when (test by hand):**
- [ ] Posting fires a push to the other user ("[name] dropped a moment", no preview);
      tapping it opens the feed at the new post.
- [ ] Quiet hours defer delivery to the unmute time; two quick posts batch into one.
- [ ] Settings persist (name, avatar, quiet hours); account deletion behaves per
      PRD §10 (your posts gone; ex-partner keeps their archive copy).
- [ ] Push verified on Android and on iOS-installed PWA; typecheck + build pass.

---

## Out of scope (do not build)

- **Year-in-review** — explicitly cut.
- Replies, comments, threads; multiple reactions per post; any visible metric
  (likes/views/counts); groups or a third user; editing posts; public sharing;
  stories; photo filters/stickers/captions; video; in-feed search. _(PRD §3 "Out".)_
- **Magic-link sign-in** — reserved seam (stub only); real email sender wired later.

---

## Open decisions to confirm before/within each phase

- **Mongo transactions** need a replica set for the atomic pair-lock. Confirm the
  deploy target (Atlas = available); local dev uses a single-node replica set or the
  guarded compare-and-set fallback. _[Phase 1]_
- **Seed users** for QA/testing (two paired accounts). _[Phase 1]_
- **Voice format:** ship Opus/WebM and only add server-side MP3 transcode if a device
  fails playback in QA. _[Phase 5]_
- **iOS push:** conditional (16.4+, home-screen-installed) and untestable without a
  real device — Phase 7 carries a device-test gate. _[Phase 7]_
- **Hosting / deploy target** for backend + Mongo (Railway alongside the
  file-service?). _[before launch]_
