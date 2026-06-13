import mongoose from 'mongoose';

import { env } from '../env.js';
import { logger } from './logger.js';

// Single Mongoose connection for the process. server.ts calls connectDb()
// before listening; tests call it with an in-memory URI. Mongoose buffers
// commands until connected, so models can be defined at import time.

mongoose.set('strictQuery', true);

export async function connectDb(uri: string = env.MONGODB_URI): Promise<typeof mongoose> {
  const conn = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000,
  });
  logger.info({ host: conn.connection.host, db: conn.connection.name }, 'mongo connected');
  return conn;
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}

/** True when transactions are available (replica set / Atlas). */
export function supportsTransactions(): boolean {
  // A standalone mongod reports no replica set; transactions require one.
  // Callers fall back to a guarded compare-and-set when this is false.
  // mongoose exposes the topology lazily; we treat "unknown" as unsupported.
  const client = mongoose.connection.getClient();
  const desc = client as unknown as { topology?: { description?: { type?: string } } };
  const type = desc.topology?.description?.type;
  return type === 'ReplicaSetWithPrimary' || type === 'Sharded';
}
