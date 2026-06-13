import { createServer, type Server } from 'node:http';

import { connectDb, disconnectDb } from '@lib/db.js';
import { logger } from '@lib/logger.js';

import { buildApp } from './app.js';
import { env, isPushConfigured } from './env.js';

// Production-only runtime checks (rules.md §8): things that must not block dev
// boot but are required in prod.
const assertProdConfig = (): void => {
  if (env.NODE_ENV === 'production' && !isPushConfigured()) {
    logger.warn('VAPID keys not set — push notifications are disabled in production');
  }
};

const start = async (): Promise<Server> => {
  assertProdConfig();
  await connectDb();
  const app = buildApp();
  const server = createServer(app);
  server.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, 'main-backend listening');
  });
  return server;
};

const serverPromise = start().catch((err) => {
  logger.error({ err }, 'failed to start');
  process.exit(1);
});

const shutdown = async (signal: string): Promise<void> => {
  logger.info({ signal }, 'shutting down gracefully');
  const server = await serverPromise;
  if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
  await disconnectDb();
  process.exit(0);
};

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
process.on('SIGINT', () => {
  void shutdown('SIGINT');
});
