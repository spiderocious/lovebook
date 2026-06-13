import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';

import { EP } from '@lovebook/api';
import type { CreatePostBody, FeedPage, Post } from '@lovebook/core';

import { getData, postData } from '@shared/api/unwrap.ts';

export const feedQueryKey = ['feed'] as const;

/** Cursor-paginated feed, newest first. */
export function useFeed() {
  return useInfiniteQuery({
    queryKey: feedQueryKey,
    queryFn: ({ pageParam }) =>
      getData<FeedPage>(pageParam ? `${EP.FEED}?cursor=${pageParam}` : EP.FEED),
    initialPageParam: '' as string,
    getNextPageParam: (last) => (last.hasMore ? last.nextCursor : undefined),
    // Recent posts should feel live; refetch the first page on focus.
    staleTime: 15_000,
  });
}

/** Flatten the infinite pages into a single newest-first post list. */
export function selectPosts(data: InfiniteData<FeedPage> | undefined): Post[] {
  return data?.pages.flatMap((p) => p.posts) ?? [];
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreatePostBody) => postData<Post>(EP.POSTS, body),
    onSuccess: (post) => {
      // Insert at the top of the first page optimistically-after-success.
      qc.setQueryData<InfiniteData<FeedPage>>(feedQueryKey, (prev) => {
        if (!prev) return prev;
        const [first, ...rest] = prev.pages;
        if (!first) return prev;
        return {
          ...prev,
          pages: [{ ...first, posts: [post, ...first.posts] }, ...rest],
        };
      });
    },
  });
}
