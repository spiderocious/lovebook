import type { Request, Response, NextFunction } from 'express';

import { UnauthorizedError } from '@lib/errors.js';
import { requestContext } from '@lib/http/requestContext.js';
import { verifyAccess } from '@lib/jwt.js';

// Verifies the Bearer access token and stamps userId onto the request context
// (read by the logger and downstream middleware/services). Throws — the central
// errorHandler turns it into a 401 envelope.
export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing bearer token');
  }
  const claims = verifyAccess(header.slice('Bearer '.length).trim());
  requestContext.set('userId', claims.sub);
  next();
};

/** The authenticated user id, set by requireAuth. Throws if absent (misordered middleware). */
export function currentUserId(): string {
  const userId = requestContext.get()?.userId;
  if (!userId) throw new UnauthorizedError();
  return userId;
}
