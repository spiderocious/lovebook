import { EP, uploadToStorage } from '@lovebook/api';
import type { CreatePostBody, Post, UploadTarget } from '@lovebook/core';

import { getData, postData } from '@shared/api/unwrap.ts';
import type { OutboxEntry } from '@app/pwa/outbox.ts';

// Turn an outbox entry into a created post: upload media bytes (if any) to
// storage via a fresh upload-uri, then create the post. Used by both the
// live composer (Phase 5 media) and the offline replay. Text posts skip the
// upload step entirely.
export async function sendOutboxEntry(entry: OutboxEntry): Promise<Post> {
  let body: CreatePostBody;

  if (entry.type === 'text') {
    body = { type: 'text', text: entry.text ?? '' };
  } else {
    if (!entry.blob || !entry.ext) {
      throw new Error('Media outbox entry is missing its blob');
    }
    const target = await getData<UploadTarget>(`${EP.MEDIA_UPLOAD_URI}?ext=${entry.ext}`);
    await uploadToStorage(target.uri, entry.blob);
    body =
      entry.type === 'voice'
        ? { type: 'voice', mediaKey: target.key, durationMs: entry.durationMs ?? 0 }
        : { type: 'photo', mediaKey: target.key };
  }

  return postData<Post>(EP.POSTS, body);
}
