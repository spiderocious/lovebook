# Seam Contract — backend ↔ frontend (lovebook)

The single place to verify the backend response shapes match what the frontend
will consume. The fullstack discipline: drift here is the #1 silent bug. Both
sides derive from `@lovebook/core` — types in `core/src/types`, request schemas
in `core/src/domain/schemas`. Verify this list before any frontend slice ships.

## Contract Drift Checklist

```
[✓] Mongoose field names ↔ core DTO field names match exactly
      (serialize.ts is the single Doc→DTO translator — the enforcement point)
[✓] Nullable fields use `| null` on BOTH sides, never optional `?`
      User.avatarKey, User.pairId, User.quietHours, Post.text, Post.mediaKey,
      Post.durationMs, Post.reaction, Pair.archivedAt → all `T | null`
[✓] Pagination: FeedPage { nextCursor: string | null, hasMore: boolean }
      Cursor is the last post's id; first page omits ?cursor
[✓] Dates: backend sends ISO 8601 strings (createdAt, expiresAt, archivedAt)
      Frontend must never do number math on them
[✓] Arrays: empty feed → posts: [] (never null); archives → [] (never null)
[✓] Error codes: frontend branches on error.code, NEVER error.message
      (message is human copy and may change; code is the contract)
[✓] Auth refresh shape: { data: { access_token, refresh_token } }
      pinned by the @lovebook/api ky client refresh hook — do not change
[✓] Reaction emoji is constrained to REACTIONS (the 6) on both sides via
      reactionEmojiSchema / setReactionBodySchema
[✓] Post create is a discriminated union on `type` — frontend builds the same
      shape from createPostBodySchema (text ≤200, voice durationMs ≤30000)
```

## What the frontend consumes (Phase 2+)

| Hook (to build) | EP | Returns |
|---|---|---|
| `useRegister` / `useLogin` | `AUTH_REGISTER` / `AUTH_LOGIN` | `{ user, tokens }` |
| `useMe` | `AUTH_ME` | `User` |
| `useUpdateMe` | `ME` (PATCH) | `User` |
| `useDeleteAccount` | `ME` (DELETE) | 204 |
| `useCreateInvite` | `PAIR_INVITE` | `Invite` |
| `useInviteLookup` | `PAIR_LOOKUP(ref)` | `InvitePreview` |
| `useClaimPair` | `PAIR_CLAIM` | `Pair` |
| `usePair` | `PAIR` | `Pair \| null` |
| `useLeavePair` | `PAIR_LEAVE` | `{ archivedPairId }` |
| `useArchives` | `PAIR_ARCHIVES` | `Pair[]` |
| `useFeed` (infinite) | `FEED` | `FeedPage` |
| `useCreatePost` | `POSTS` | `Post` |
| `usePostMedia` | `POST_MEDIA(id)` | `{ uri, expiresIn }` |
| `useUploadTarget` | `MEDIA_UPLOAD_URI` | `{ key, uri, expiresIn }` |
| `useSetReaction` / `useClearReaction` | `POST_REACTION(id)` | `Reaction` / 204 |
| `usePushKey` / `useSubscribePush` | `PUSH_KEY` / `PUSH_SUBSCRIBE` | `{ key }` / `{ ok }` |

Network shape (rules.md §2): `apiClient.get(EP.X).json<ApiResponse<T>>()` →
unwrap `.data` inside the queryFn. The media upload itself uses
`uploadToStorage(uri, blob)` from `@lovebook/api` (a raw PUT, not the ky client).

## Cross-pair isolation (verified by tests)

- Every feed/post/reaction/media route is scoped to the caller's active pair.
- A user in pair X cannot read pair Y's feed (returns `[]`) or fetch pair Y's
  media (`403`). This is enforced in the service layer, not the client.
