import type { InfiniteData } from '@tanstack/react-query';

import type { FeedPage, Post } from '@lovebook/core';

/** Immutably map a single post (by id) across all feed pages. */
export function patchPostInFeed(
  data: InfiniteData<FeedPage> | undefined,
  postId: string,
  patch: (post: Post) => Post,
): InfiniteData<FeedPage> | undefined {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      posts: page.posts.map((p) => (p.id === postId ? patch(p) : p)),
    })),
  };
}
