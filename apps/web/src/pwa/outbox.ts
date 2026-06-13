import { type DBSchema, type IDBPDatabase, openDB } from 'idb';

import type { PostType } from '@lovebook/core';

// The compose outbox. A post composed offline (or that fails to send) is written
// here with its media blob; a replay on reconnect uploads the blob, creates the
// post, and removes the entry. Wired in Phase 0; exercised once posts exist
// (Phase 4 text, Phase 5 media). See docs/lovebook-plan.md §7.

export interface OutboxEntry {
  /** Client-generated id; also the optimistic post id in the feed. */
  id: string;
  type: PostType;
  text: string | null;
  /** For photo/voice: the raw bytes to upload, plus the storage extension. */
  blob: Blob | null;
  ext: string | null;
  durationMs: number | null;
  createdAt: number; // epoch ms — for ordering + the optimistic timestamp
}

interface OutboxDb extends DBSchema {
  outbox: { key: string; value: OutboxEntry };
}

const DB_NAME = 'lovebook';
const STORE = 'outbox';
let dbPromise: Promise<IDBPDatabase<OutboxDb>> | null = null;

function db(): Promise<IDBPDatabase<OutboxDb>> {
  dbPromise ??= openDB<OutboxDb>(DB_NAME, 1, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(STORE)) {
        database.createObjectStore(STORE, { keyPath: 'id' });
      }
    },
  });
  return dbPromise;
}

export async function enqueue(entry: OutboxEntry): Promise<void> {
  await (await db()).put(STORE, entry);
}

export async function listOutbox(): Promise<OutboxEntry[]> {
  const all = await (await db()).getAll(STORE);
  return all.sort((a, b) => a.createdAt - b.createdAt);
}

export async function dequeue(id: string): Promise<void> {
  await (await db()).delete(STORE, id);
}

export async function clearOutbox(): Promise<void> {
  await (await db()).clear(STORE);
}
