---
name: lovebook-frontend-gotchas
description: React/react-query pitfalls hit in the lovebook frontend and how they were fixed
metadata:
  type: project
---

Three bugs found during manual testing of the lovebook web app (apps/web), all React lifecycle, NOT backend/CORS:

1. **Mutation fired from a mount `useEffect` strands its result under StrictMode.** The invite screen minted via `useEffect(() => createInvite.mutate(), [])` with a `mintedRef` guard. The network 201'd and `postData` resolved, but `createInvite.data` stayed `undefined` / `isPending` stuck true — StrictMode's double-mount discarded the observer the result landed on. **Fix: fire mutations from user events (the click handler), not mount effects.** PairScreen now owns `useCreateInvite` and calls `.mutate()` in `startInvite()`, passing state down to a presentational InviteFlow.

2. **`useEffect` depending on a react-query result object loops.** `useOutbox` had `useEffect(()=>{ if(online) flush() }, [online, flush])` where `flush` was recreated whenever its `flushing` *state* changed → flush → setState → new flush identity → effect re-runs → ~500 calls/2s on /feed (each cycle invalidated the feed query). **Fix: in-flight guard must be a `useRef`, not state**, so the callback has stable identity; and early-return when the queue is empty so it never touches the feed cache. Same class of bug in FeedScreen's IntersectionObserver effect (`[feed]` dep recreated the observer every render) — fixed by creating the observer once (`[]`) and reading live query state through a `feedRef`.

3. Lesson: when a promise "resolves in the network tab but the UI is stuck," log the mutation/query state object across renders — if `data` stays undefined while the fn resolved, it's an observer-lifecycle bug, not the network.

Also added (this session): **global IP rate limiting** via express-rate-limit in apps/main-backend — `globalRateLimit` (300/min/IP) in app.ts, `authRateLimit` (20/15min/IP) on /auth/login + /auth/register. Both `skip` when NODE_ENV==='test' so the suite (which hammers register from one IP) stays green. 429s funnel through AppError → the standard envelope with Retry-After.

NOTE: the user reverted my CORS change in app.ts back to `origin:"*"` — they consider CORS out of scope here; do not re-touch it unless asked. See [[lovebook-product]].
