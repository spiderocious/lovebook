import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';

import { EP } from '@lovebook/api';
import type { FeedPage, Reaction } from '@lovebook/core';

import { patchPostInFeed } from './feed-cache.ts';
import { putData, sendNoContent } from '@shared/api/unwrap.ts';
import { feedQueryKey } from './use-feed.ts';

// One reaction per person per post (PRD); a pair has up to two. The feed cache
// holds the full `reactions[]`, so optimistic updates add/replace/remove only
// MY entry (keyed by my user id) and leave my partner's untouched.

function upsertMine(reactions: Reaction[], myId: string, emoji: string): Reaction[] {
  const mine: Reaction = { emoji, reactorId: myId, createdAt: new Date(0).toISOString() };
  const others = reactions.filter((r) => r.reactorId !== myId);
  return [...others, mine];
}

function removeMine(reactions: Reaction[], myId: string): Reaction[] {
  return reactions.filter((r) => r.reactorId !== myId);
}

export function useSetReaction(myId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, emoji }: { postId: string; emoji: string }) =>
      putData<Reaction>(EP.POST_REACTION(postId), { emoji }),
    onMutate: ({ postId, emoji }) => {
      const prev = qc.getQueryData<InfiniteData<FeedPage>>(feedQueryKey);
      qc.setQueryData<InfiniteData<FeedPage>>(feedQueryKey, (data) =>
        patchPostInFeed(data, postId, (p) => ({
          ...p,
          reactions: upsertMine(p.reactions, myId, emoji),
        })),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(feedQueryKey, ctx.prev);
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: feedQueryKey }),
  });
}

export function useClearReaction(myId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => sendNoContent('delete', EP.POST_REACTION(postId)),
    onMutate: (postId) => {
      const prev = qc.getQueryData<InfiniteData<FeedPage>>(feedQueryKey);
      qc.setQueryData<InfiniteData<FeedPage>>(feedQueryKey, (data) =>
        patchPostInFeed(data, postId, (p) => ({ ...p, reactions: removeMine(p.reactions, myId) })),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(feedQueryKey, ctx.prev);
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: feedQueryKey }),
  });
}
