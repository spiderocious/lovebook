# Frontend QA Handoff — lovebook (Phases 2–7)

**Date:** 2026-06-13
**Build:** Typecheck ✅ · Lint ✅ · Build ✅ (Vite + PWA)
**Frontend URL:** http://localhost:5173
**Backend:** http://localhost:9092 (run `pnpm -F @lovebook/main-backend dev`; needs Mongo)
**Seed:** self-serve — register two accounts in two browsers/profiles and pair them.

The whole PWA is built on the Phase-1 API. Every screen is lazy-loaded; all data
goes through react-query hooks hitting `EP.*`; UI is `@lovebook/ui` only. To test
the two-person flows you need **two sessions** (two browsers, or one normal + one
incognito) so each holds its own token.

---

## Run it

```bash
cp apps/web/.env.example apps/web/.env     # VITE_API_BASE_URL=http://localhost:9092
pnpm -F @lovebook/main-backend dev         # backend on :9092 (Mongo required)
pnpm -F @lovebook/web dev                  # web on :5173
```

PWA/offline + push only work in a **production build served over HTTPS** (or
localhost): `pnpm -F @lovebook/web build && pnpm -F @lovebook/web preview`. The
service worker is disabled in `vite dev` by design.

---

## Routes & guards

| Route | Screen | Gate |
|-------|--------|------|
| `/` | Landing | guests only (authed → feed or pair) |
| `/login` | Login | guests only |
| `/register` | Register (carries `?pair=<ref>`) | guests only |
| `/pair` | Pairing hub (invite / enter code) | authed + **unpaired** |
| `/pair/:ref` | Claim/confirm (code or link) | authed (guest → register w/ ref; paired → feed) |
| `/feed` | The feed + compose | authed + **paired** |
| `/settings` | Settings | authed + paired |
| `/settings/past-pairs` | Past pairs (read-only) | authed |
| `/preview` | Design-system preview (dev) | open |

Guards live in `src/shared/guards/route-guards.tsx`. While the session resolves
(`GET /auth/me`), a loader shows; then redirect/render.

---

## Phase 2 — Auth

**Screens:** `src/features/auth/screen/{login,register}-screen.tsx`, landing at
`src/features/health/home-screen.tsx`.

- Landing → "Get started" (register) / "I have an account" (login).
- **Register:** name, email, password. Field-level errors render inline under
  each field (driven by backend `field_errors`, not hardcoded). Success stores
  tokens and lands on `/pair`.
- **Login:** email + password. Wrong creds → inline banner from backend message.
- Token lifecycle: tokens stored via `@lovebook/core` storage (the ky client
  reads them + auto-refreshes on 401). Reload keeps the session. Logout (Settings
  → Sign out) clears tokens + cache → back to `/login`.

**Verify:** register a fresh user; bad password shows under the password field;
reload stays signed in; an authed user visiting `/login` is redirected into the app.

---

## Phase 3 — Pairing

**Screens:** `src/features/pair/screen/{pair,claim}-screen.tsx` + parts.

- `/pair` hub: **Invite someone** (mints a code via `POST /pair/invite`, shows
  `InviteCodeDisplay` with a copyable share link, polls `GET /pair` every 3s and
  auto-routes to `/feed` when claimed) or **Enter an invite code**
  (`InviteCodeEntry` → navigates to `/pair/:code`).
- `/pair/:ref` claim: previews the initiator (`PairMark` + name), "Pair with
  [name]". A **guest** hitting the link is sent to `/register?pair=<ref>` and
  returned here after signup. A **paired** user is bounced to `/feed`.

**Verify (two sessions):** A invites → copies link → B (other browser) opens it →
sees "A wants to pair" → confirms → both land on the feed. Bad/expired code shows
"This invite isn't available". A can't claim their own code (backend 403 surfaces).

---

## Phase 4 — Feed + text posts

**Screen:** `src/features/feed/screen/feed-screen.tsx` + parts.

- Top bar: wordmark + **connection dot** (`StatusPill` ok/wait from `navigator.onLine`)
  + settings gear.
- Reverse-chron feed, infinite scroll (IntersectionObserver → `fetchNextPage`).
- Empty state when no posts; skeletons while loading; error state with retry.
- **Compose note:** bottom `ComposeBar` → pencil door → half-sheet `LineField`
  (200-char counter) → Send. Optimistic insert at top (online).
- **Offline:** an `InlineBanner` shows queued count; a note composed offline is
  written to the IndexedDB outbox and flushes on reconnect, then the feed refetches.

**Verify:** post a note → appears at top instantly and after reload; the other
session sees it; go offline (DevTools), compose → "waiting to send" banner → go
online → it sends.

---

## Phase 5 — Photo + voice posts

**Parts:** `compose-photo.tsx`, `compose-voice.tsx`, `use-recorder.ts`,
`post-card.tsx`.

- **Photo:** camera door opens the device camera (`<input capture>`), preview with
  Send/Retake (no filters/crop/caption — the photo is the post). Send uploads the
  blob direct to storage via a fresh `GET /media/upload-uri`, then `POST /posts`.
- **Voice:** mic door, hold-to-record (`MediaRecorder`, Opus/WebM), **hard stop at
  0:30**, release to preview, Send/Retake. Plays back in-feed via `<audio>`.
- **Render:** photo/voice cards resolve their media through `GET /posts/:id/media`
  (the pair-membership gate) — the signed URL is never long-lived client-side.
- **Offline:** media composed offline queues (blob in IndexedDB) and uploads on
  reconnect.

**Verify:** take a photo → it renders in both feeds; record a voice note (caps at
30s) → plays back; a photo composed offline completes on reconnect.

---

## Phase 6 — Reactions

**Part:** `reaction-control.tsx`.

- Tap the reaction button → leaves the default ❤️ (tap again clears).
- **Long-press** (~350ms) → `ReactionPicker` with the **6 allowed emojis** (from
  core `REACTIONS`, which the backend validates — not the UI package's default
  list). Pick one → replaces; pick the current one → clears.
- Optimistic update with rollback on error; one reaction per post.

**Verify:** tap ❤️ on the partner's post; long-press → pick 🔥 → it replaces (no
duplicate); the other session sees it; clearing removes it.

---

## Phase 7 — Push + settings

**Screens:** `src/features/settings/screen/settings-screen.tsx` + parts,
`past-pairs-screen.tsx`.

- **Profile:** edit display name (`PATCH /me`), Save toast.
- **Quiet hours:** toggle + two `TimeField`s; saves `{start,end,tz}` with the
  browser's resolved IANA timezone. (BUG-01 fix: a bad tz is rejected server-side.)
- **Notifications:** "Enable notifications" → permission prompt → subscribe via the
  SW `pushManager` → `POST /push/subscribe`. Disabled with a note when push is
  unconfigured (`GET /push/key` → null) or unsupported (e.g. iOS not installed).
- **Pair:** `HoldToConfirmButton` to leave (archives, → `/pair`); link to Past pairs.
- **Danger:** Sign out; Delete account via type-`DELETE` `critical` modal
  (`DELETE /me`) → back to landing.
- **Past pairs:** read-only list of archived pairs.

**Verify (prod build, HTTPS/localhost):** enable notifications → post from the
other session → a "[name] dropped a moment" notification arrives → tapping it
opens `/feed`. Quiet hours window suppresses delivery. Leave pair → both unpaired.
Delete account → your posts gone, partner keeps the archive.

---

## Known limits / out of scope

- **iOS push** needs the PWA installed to the home screen (16.4+); there is no
  fallback (PRD §12). The Notifications section degrades with a hint on unsupported
  devices.
- **Avatar upload UI** is not built this pass (the field exists on the backend +
  `User.avatarKey`); name + quiet hours cover the settings happy path.
- **Voice waveform** in cards is a placeholder pattern (no real peak extraction yet).
- **Year-in-review:** cut from the product.
- **Rate limiting / token revocation:** backend residual risks (Phase-1 report),
  not a frontend concern.

---

## Cross-cutting checks

- No `&&`/`.map()` in JSX — `Show`/`Repeat`/`Loadable` from meemaw throughout.
- No inline URLs — `ROUTES.*`; no hand-written backend paths — `EP.*`.
- Icons via `@icons`; UI via `@lovebook/ui`; errors branch on backend `code`.
- Every route lazy-loaded; one query client; `AuthProvider` is the single session source.
