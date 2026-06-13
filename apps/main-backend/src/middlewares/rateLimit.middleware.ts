import rateLimit, { type Options } from 'express-rate-limit';

import { AppError } from '@lib/errors.js';
import { env } from '../env.js';

// Disable limits under test — the suite hammers register/login from one IP and
// would otherwise trip the auth limiter. Real environments always enforce.
const skip = (): boolean => env.NODE_ENV === 'test';

// IP-based rate limiting. The handler funnels through our AppError → central
// errorHandler so 429s use the standard envelope ({ error: { code, message } })
// with a Retry-After header, instead of express-rate-limit's default text body.

const handler: Options['handler'] = (_req, _res, next, options) => {
  const retryAfterSec = Math.ceil(options.windowMs / 1000);
  next(
    new AppError('rate_limited', 'Too many requests — please slow down.', 429, undefined, retryAfterSec),
  );
};

const base = {
  standardHeaders: true, // RateLimit-* headers
  legacyHeaders: false,
  handler,
  skip,
} satisfies Partial<Options>;

/** Global limiter — generous; a backstop against runaway clients / abuse. */
export const globalRateLimit = rateLimit({
  ...base,
  windowMs: 60_000, // 1 minute
  limit: 300, // 300 req/min/IP across all routes
});

/** Strict limiter for credential endpoints — blunts brute-force (login/register). */
export const authRateLimit = rateLimit({
  ...base,
  windowMs: 15 * 60_000, // 15 minutes
  limit: 20, // 20 attempts / 15 min / IP
});
