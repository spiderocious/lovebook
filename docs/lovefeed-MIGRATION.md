# lovebook → `@lovebook/ui` — migration report

**Shipped:** 2026-06-12
**Stance:** "The shoebox" — ivory paper, dusty plum as the one accent, the serif
belongs to humans, cold crimson guards only the two irreversible doors.
**Visual spec (source of truth):**
`/Users/feranmi/codebases/2026/dockito/design-system/projects/lovebook/preview/`
— every `NN-*.html` specimen + `_foundation.css`. The HTML survives as the
canonical reference; this library is its production sibling, not its replacement.

---

## Conventions detected (and followed)

- **Monorepo:** Nx + pnpm, React 19, TypeScript strict (`noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`, `any` banned). Library at `packages/ui`, published
  as `@lovebook/ui` and **consumed as source** (`main` → `src/index.ts`).
- **File layout:** folder-per-component, `<group>/<kebab>/<kebab>.tsx + index.ts`,
  re-exported from `src/index.ts`. **Descriptive names, never numeric-prefixed** —
  the Studio's `NN-` numbering did not carry over.
- **Exports:** named. **Props:** `interface` (mutable). **Refs:** `forwardRef`
  where a ref helps. **Component naming:** `App*` for the generic primitives
  (`AppButton`, `AppText`), domain names elsewhere.
- **Class composition:** the existing `cn` (`twMerge(clsx())`) at
  `packages/ui/src/utils/cn.ts`.
- **`meemaw`** for control-flow/clipboard (added as a dep — it was not present).
  Used `Repeat` (lists) and `CopyToClipboard` (the invite-code copy state).

### Decisions surfaced before writing

1. **Import extensions.** The scaffold imported with `.js` specifiers; the standing
   rule is `.ts/.tsx`. Switched the `ui` build to
   `allowImportingTsExtensions: true` + `emitDeclarationOnly: true` (apps consume
   the package as source, so no runtime JS is needed — only `.d.ts`). Converted the
   two existing files. **Also added `allowImportingTsExtensions` to
   `apps/website/tsconfig.json`** (web + admin already had it) so the Next.js app
   typechecks the package source.
2. **Re-theme, no rebrand.** The repo was already rebranded to `@lovebook/*` (an
   earlier pass), but still carried the generic template **theme** (navy/orange,
   Georgia). This ship re-themed the tokens to the shoebox and replaced the
   placeholder `AppButton`/`AppText` bodies.
3. **Tokens as CSS variables.** Defined in `packages/ui/src/styles.css` (`:root` +
   a `.lamplight` dark override) and read by name through a shared Tailwind preset
   (`packages/ui/src/tailwind-preset.ts`) that all three app configs spread. This
   is what makes **Lamplight** a single `.lamplight` class on `<html>` rather than
   per-component dark branching.
4. **Fonts** via `@fontsource` (Source Serif 4, Inter, JetBrains Mono, Fraunces),
   imported in `apps/web/src/main.tsx`.

---

## Components generated (29 + the foundation)

### Foundation (token consumers)
- `styles.css` — `:root` + `.lamplight` token layer
- `theme/index.ts` — TS mirror (`COLORS`, `FONTS`, `RADII`, `MOTION`)
- `tailwind-preset.ts` — shared theme; spread by `web`, `admin-web`, `website`

### Primitives
- `AppButton` — pill family (primary/secondary/quiet/danger × sm/md/lg, loading, disabled)
- `HoldToConfirmButton` — the crimson door; 1.2s hold, release-to-cancel, keyboard-held
- `AppText` — the typographic voice (display/ceremony/voice/scrawl/heading/body/body-sm/label/overline/record); "the serif belongs to humans" baked into the variants
- `LineField` — the bare serif composer line; counter ambers at the limit (real input)
- `ChromeField` — small sans auth/profile field (+ `mono`)
- `TimeField` — mono time pill (native `type="time"`)
- `InviteCodeEntry` — the one boxed input; **a real focusable input** (six cells, paste, `onComplete`, mobile keyboard) — not a styled display
- `InviteCodeDisplay` — huge mono code + copy (meemaw `CopyToClipboard`)
- `Switch` + `SettingRow` — the product's only selection control, in its labelled row

### Display
- `Avatar` + `PairMark` — you (filled plum) / them (washed) / the overlapping pair mark; sizes sm–xl
- `ReactionButton` — empty / left / changing states (one per moment, no counts)
- `ReactionPicker` — the floating pill of six (controlled selection)
- `StatusPill` — ok/wait/crit × the five statuses; steady dot; `dotOnly`
- `Timestamp` — human-first label, exact mono on tap (`humanizeTimestamp`/`exactTimestamp` exported, pure/testable)

### Moments (the signature display)
- `PolaroidMoment` — tilted photo print, pencil author, reaction; loading state
- `PostcardMoment` — serif text on dotted rule, faded quote mark; failed state
- `VoiceMoment` — quiet card, real-amplitude waveform (`number[]`), play, duration; queued/offline dashed state

### State (the kind, serif-voiced feed states)
- `Skeleton` — polaroid/postcard breathing shapes
- `EmptyState` — serif-voiced (brand-new-pair w/ action · quiet-lately · couldn't-load)
- `InlineBanner` — the in-feed amber strip (distinct from the imperative BannerHost)

### Compose
- `ComposeBar` — segmented labelled pill (Photo/Voice/Note)
- `VoiceRecorder` — mic well, live waveform, 0:30 mono timer (presentational; app drives capture)

### Overlays — feedback primitives + the DrawerService layer
- `Toast`, `Banner` (`overlays/feedback/`) — the inverted ink slip + the amber strip
- `Modal`, `CriticalModal`, `CustomModal` (`overlays/modal/`) — portal + focus scrim;
  `danger` uses hold-to-confirm, `critical` uses typed-confirm; both wear the crimson rule;
  positions (center/top/bottom/left/right) back half-sheets and side drawers
- **DrawerService** (`overlays/drawer/`, the 7-file pattern):
  `drawer-store.ts` · `drawer-service.ts` · `toast-host.tsx` · `banner-host.tsx` ·
  `modal-host.tsx` · `swipeable-toast.tsx` · `index.ts`. Framework-free pub-sub +
  `useSyncExternalStore` + `createPortal`. Modal kinds: standard / danger / critical /
  custom. Banners never stack (a new one replaces the queue).

**Hosts** (`<ToastHost />`, `<BannerHost />`, `<ModalHost />`) are mounted once in
`apps/web/src/app.tsx`.

---

## The viewer

Route **`/preview`** in `apps/web` (`ROUTES.PREVIEW`), screen at
`apps/web/src/features/preview/`. Every component is registered in
`preview-sections.tsx` and rendered with its variants/states in situ. A **Lamplight
toggle** in the sidebar sets `.lamplight` on `<html>` so the whole system can be
reviewed in the 11pm room. The overlays section exercises the full DrawerService API.

Run it: `pnpm --filter @lovebook/web dev`, then open `/preview`.

---

## Skipped — scenes, not library components

These Studio surfaces compose the primitives above; they belong in **application
code** (`apps/web` features), not the library. Build them there using the spec as
reference:

- `30-the-feed.html` — the assembled feed column (polaroids/postcards/voice in one
  shared column, the compose bar floating). Build as a feed feature.
- `31-pairing.html` — the ceremonial pairing flow (code handshake → pair mark →
  serif welcome). Uses `InviteCodeDisplay`/`InviteCodeEntry`/`PairMark`.
- `32-year-review.html` — the year-in-review (Fraunces numbers, the moment of the
  year re-rendered). Uses `AppText variant="display"` + `PairMark`.
- `33-lamplight.html` — the dark-mode *scene*. The `.lamplight` **token scope** IS
  shipped (toggle it in `/preview`); the scene itself is app composition.
- `34-settings.html` — the settings surface. Uses `SettingRow`/`Switch`/`TimeField`/
  the resting `danger` button.
- The push-notification mockup in `41-feedback.html` — OS-level, not a component.

---

## Manual work remaining

- **Audio/photo capture** is the app's job. `VoiceMoment`/`VoiceRecorder` take a
  `number[]` amplitude array and `PolaroidMoment` takes a `src` — the library does
  no media decoding. Wire real capture in the app.
- **The five skipped scenes** (above) — build in `apps/web` features.
- **`admin-web` / `website`** placeholders were re-pointed at the shoebox theme and
  updated to compile, but their *content* is still template boilerplate.
- No tests were written (matches the repo — none next to components).

---

## Verification (all green at ship time)

- `nx run-many -t typecheck` — 7/7 projects
- `nx run-many -t lint` — 7/7 projects
- `@lovebook/ui` build — `.d.ts` declarations emitted to `dist/`
- `@lovebook/web` Vite production build — succeeds; fonts + token CSS bundle
