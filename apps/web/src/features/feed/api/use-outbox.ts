import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { dequeue, enqueue, listOutbox, type OutboxEntry } from '@app/pwa/outbox.ts';
import { useOnline } from '@shared/hooks/use-online.ts';

import { feedQueryKey } from './use-feed.ts';
import { sendOutboxEntry } from './send-post.ts';

// Drives the compose outbox: queued posts (composed offline, or that failed to
// send) are stored in IndexedDB and flushed when the connection returns.
//
// The in-flight guard is a REF, not state — so `flush` has a stable identity and
// the connectivity effect can't re-fire on every render (that was a runaway loop:
// flush → setState → new flush identity → effect re-runs → flush → …).
export function useOutbox() {
  const online = useOnline();
  const qc = useQueryClient();
  const [pending, setPending] = useState<OutboxEntry[]>([]);
  const flushingRef = useRef(false);

  const refresh = useCallback(async () => {
    setPending(await listOutbox());
  }, []);

  const flush = useCallback(async () => {
    if (flushingRef.current) return;
    flushingRef.current = true;
    try {
      const entries = await listOutbox();
      if (entries.length === 0) return; // nothing to do — never touches the feed cache
      for (const entry of entries) {
        try {
          await sendOutboxEntry(entry);
          await dequeue(entry.id);
        } catch {
          // Leave it queued; we'll retry on the next online/flush.
          break;
        }
      }
      await refresh();
      void qc.invalidateQueries({ queryKey: feedQueryKey });
    } finally {
      flushingRef.current = false;
    }
  }, [qc, refresh]);

  // Load the queue once on mount.
  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Flush on connectivity transitions only. `flush` is stable (no state deps), so
  // this fires when `online` flips, not on every render.
  useEffect(() => {
    if (online) void flush();
  }, [online, flush]);

  const queue = useCallback(
    async (entry: OutboxEntry) => {
      await enqueue(entry);
      await refresh();
      if (online) void flush();
    },
    [online, flush, refresh],
  );

  return { pending, queue, flush, online };
}
