import type { Request, Response, NextFunction } from 'express';

import { ForbiddenError } from '@lib/errors.js';
import { requestContext } from '@lib/http/requestContext.js';
import { UserModel } from '../models/user.model.js';
import { currentUserId } from './auth.middleware.js';

// Loads the caller's active pair and stamps pairId onto the request context.
// 403 if the user is not currently paired. Must run AFTER requireAuth.
export const requirePair = async (
  _req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId = currentUserId();
  const user = await UserModel.findById(userId).select('pairId').lean();
  if (!user?.pairId) {
    throw new ForbiddenError('You are not in a pair');
  }
  requestContext.set('pairId', user.pairId.toString());
  next();
};

/** The caller's active pair id, set by requirePair. */
export function currentPairId(): string {
  const pairId = requestContext.get()?.pairId;
  if (!pairId) throw new ForbiddenError('You are not in a pair');
  return pairId;
}
