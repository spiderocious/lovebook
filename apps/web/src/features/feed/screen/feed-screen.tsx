import { useEffect, useRef } from 'react';

import { AppButton, EmptyState, InlineBanner, Skeleton } from '@lovebook/ui';
import { Loadable, Repeat, Show } from 'meemaw';

import { useAuth } from '@features/auth/providers/auth-provider.tsx';
import { usePair } from '@features/pair/api/use-pair.ts';

import { selectPosts, useFeed } from '../api/use-feed.ts';
import { useOutbox } from '../api/use-outbox.ts';
import { ComposeHost } from './parts/compose-host.tsx';
import { FeedTopBar } from './parts/feed-top-bar.tsx';
import { PostCard } from './parts/post-card.tsx';

export function FeedScreen() {
  const { user } = useAuth();
  const { data: pair } = usePair();
  const feed = useFeed();
  const { pending } = useOutbox();

  const posts = selectPosts(feed.data);
  const partner = pair?.members.find((m) => m.id !== user?.id);
  const partnerName = partner?.name ?? 'your person';

  const authorName = (authorId: string): string => {
    if (authorId === user?.id) return 'You';
    return partner?.name ?? 'Them';
  };

  // Infinite scroll: load the next page when the sentinel scrolls into view.
  // The observer is created ONCE (empty deps). It reads the latest query state
  // through a ref so the effect never re-runs on `feed`'s changing identity —
  // depending on `feed` here re-created the observer every render and could
  // hammer fetchNextPage in a loop.
  const sentinel = useRef<HTMLDivElement>(null);
  const feedRef = useRef(feed);
  feedRef.current = feed;
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      const f = feedRef.current;
      if (entries[0]?.isIntersecting && f.hasNextPage && !f.isFetchingNextPage) {
        void f.fetchNextPage();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="min-h-dvh bg-paper pb-32">
      <FeedTopBar />

      <Show when={pending.length > 0}>
        <div className="px-5 pt-3">
          <InlineBanner>
            {pending.length === 1
              ? 'One moment is waiting to send…'
              : `${pending.length} moments are waiting to send…`}
          </InlineBanner>
        </div>
      </Show>

      <main className="mx-auto flex max-w-md flex-col gap-6 px-5 py-6">
        <Loadable
          loading={feed.isLoading}
          error={feed.isError}
          loadingComponent={
            <Repeat times={3}>{(_: unknown, i: number) => <Skeleton key={i} kind="polaroid" />}</Repeat>
          }
          errorComponent={
            <EmptyState
              message="We couldn’t load your feed."
              action={<AppButton onClick={() => void feed.refetch()}>Try again</AppButton>}
            />
          }
        >
          <Show
            when={posts.length > 0}
            fallback={
              <EmptyState
                message="Your space is quiet."
                note={`Drop the first moment — ${partnerName} will see it.`}
              />
            }
          >
            <Repeat each={posts}>
              {(post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  authorName={authorName(post.authorId)}
                  myId={user?.id ?? ''}
                />
              )}
            </Repeat>
          </Show>

          <div ref={sentinel} aria-hidden="true" className="h-px" />
          <Show when={feed.isFetchingNextPage}>
            <Skeleton kind="postcard" />
          </Show>
        </Loadable>
      </main>

      <ComposeHost partnerName={partnerName} />
    </div>
  );
}
