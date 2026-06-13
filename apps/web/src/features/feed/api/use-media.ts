import { useQuery } from '@tanstack/react-query';

import { EP } from '@lovebook/api';
import type { MediaUri } from '@lovebook/core';

import { getData } from '@shared/api/unwrap.ts';

export const mediaQueryKey = (postId: string) => ['post-media', postId] as const;

/**
 * Resolve a signed view URL for a post's media through the backend access gate.
 * Cached for under the URL's ~1h lifetime; the SW caches the bytes themselves.
 */
export function usePostMedia(postId: string, enabled = true) {
  return useQuery({
    queryKey: mediaQueryKey(postId),
    queryFn: () => getData<MediaUri>(EP.POST_MEDIA(postId)),
    enabled,
    staleTime: 45 * 60 * 1000, // refetch well before the 1h signed-URL expiry
  });
}
