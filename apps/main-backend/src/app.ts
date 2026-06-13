import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { register as registerAuth } from '@features/auth/index.js';
import { register as registerFeed } from '@features/feed/index.js';
import { register as registerHealth } from '@features/health/index.js';
import { register as registerMe } from '@features/me/index.js';
import { register as registerPair } from '@features/pair/index.js';
import { register as registerPush } from '@features/push/index.js';
import { errorHandler } from '@middlewares/errorHandler.middleware.js';
import { globalRateLimit } from '@middlewares/rateLimit.middleware.js';
import { requestIdMiddleware } from '@middlewares/requestId.middleware.js';
import { requestLogMiddleware } from '@middlewares/requestLog.middleware.js';

// Registration order matters: specific paths before broad ones. None of these
// prefixes overlap, but we keep a deliberate order (health first for probes,
// auth before authed features) for clarity.
const features = [
  registerHealth,
  registerAuth,
  registerMe,
  registerPair,
  registerFeed,
  registerPush,
];

export const buildApp = (): express.Express => {
  const app = express();

  app.set('trust proxy', 1);

  app.use(helmet());
  // CORS: when credentials are allowed, the spec forbids the wildcard
  // `Access-Control-Allow-Origin: *` — the browser blocks the response. So we
  // REFLECT the request's Origin instead. In dev (WEB_BASE_URL='*') we reflect
  // any origin (covers whatever localhost port Vite picks: 5173, 5174, …); in
  // prod we reflect only the configured WEB_BASE_URL.
  app.use(
    cors({
      origin: "*",
      credentials: true,
    }),
  );

  app.use(requestIdMiddleware);
  app.use(requestLogMiddleware);

  // Global IP rate limit — a backstop against runaway clients / abuse (relies on
  // `trust proxy` above for the real client IP). Stricter per-route limits (auth)
  // are applied inside their feature routers.
  app.use(globalRateLimit);

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(compression());

  features.forEach((register) => register(app));

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'not_found', message: 'Route not found' } });
  });

  app.use(errorHandler);

  return app;
};
