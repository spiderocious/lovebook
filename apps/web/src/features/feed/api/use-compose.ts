import { useCallback } from 'react';

import type { OutboxEntry } from '@app/pwa/outbox.ts';
import { useOnline } from '@shared/hooks/use-online.ts';

import { useCreatePost } from './use-feed.ts';
import { useOutbox } from './use-outbox.ts';

let seq = 0;
function clientId(): string {
  seq += 1;
  return `obx_${Date.now().toString(36)}_${seq}`;
}

export interface ComposeInput {
  type: 'text' | 'photo' | 'voice';
  text?: string;
  blob?: Blob;
  ext?: string;
  durationMs?: number;
}

// Unified compose entrypoint. Online text posts go straight through the
// optimistic create path; everything offline — and all media — goes to the
// IndexedDB outbox, which flushes on reconnect. Either way the feed reconciles.
export function useCompose() {
  const online = useOnline();
  const createPost = useCreatePost();
  const { queue, pending } = useOutbox();

  const compose = useCallback(
    async (input: ComposeInput) => {
      if (online && input.type === 'text') {
        await createPost.mutateAsync({ type: 'text', text: input.text ?? '' });
        return;
      }
      const entry: OutboxEntry = {
        id: clientId(),
        type: input.type,
        text: input.text ?? null,
        blob: input.blob ?? null,
        ext: input.ext ?? null,
        durationMs: input.durationMs ?? null,
        createdAt: Date.now(),
      };
      await queue(entry);
    },
    [online, createPost, queue],
  );

  return { compose, queuedCount: pending.length, online, sending: createPost.isPending };
}
