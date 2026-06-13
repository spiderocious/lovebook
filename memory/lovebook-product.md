---
name: lovebook-product
description: What lovebook is, its stack, and the agreed build approach
metadata:
  type: project
---

**lovebook** (NOT "LoveFeed" — the PRD title says LoveFeed but the product name is lovebook; always use lovebook) is a two-person ambient feed PWA. Two users pair; each sees one shared reverse-chron feed of moments. Three post types: photo, voice note (≤30s), one-line text (≤200 chars). One reaction per post (default ❤️, long-press for 6 alternatives). No replies, no metrics, no third user. Push when the other posts.

Repo: `/Users/feranmi/codebases/2026/lovebook` — a TS pnpm/Nx monorepo. Package scope `@lovebook/*` stays as-is (matches the product, no rebrand). The **design system in `packages/ui` is already fully built** (PolaroidMoment, VoiceMoment, ComposeBar, ReactionPicker, InviteCodeEntry, etc.) — design is OUT of scope; frontend consumes it as-is. The **backend is bare scaffolding** (Express + envelope + error classes + a fake JWT stub; no DB/auth/storage/push).

**Stack decisions (locked):** Express backend · `apps/web` Vite/React PWA · **MongoDB + Mongoose** (behind repo ports; cursor pagination on `_id`, never offset) · email+password auth (bcrypt+JWT; magic link later) · media via the external **go-file-service proxy** (backend stores only the file `key`, is the access-control gate for signed view URLs) · **Web Push (VAPID)** · **PWA + offline from the start**.

**Build order** (mirrors the shirtify phases.md pattern): backend built once and complete in one phase, frontend built progressively on the stable contract-tested API. **No year-in-review** (explicitly cut by the user). The refresh endpoint shape is pinned by the existing ky client (`res.data.access_token`).

Plan docs: [[lovebook-plan-docs]].
