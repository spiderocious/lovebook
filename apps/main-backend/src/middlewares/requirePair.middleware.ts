import { ForbiddenError } from '@lib/errors.js';
import { asyncHandler } from '@lib/http/asyncHandler.js';
import { requestContext } from '@lib/http/requestContext.js';
import { UserModel } from '../models/user.model.js';
import { currentUserId } from './auth.middleware.js';

// Loads the caller's active pair and stamps pairId onto the request context.
// 403 if the user is not currently paired. Must run AFTER requireAuth.
//
// Wrapped in asyncHandler: this is async middleware, and Express 4 does not
// catch rejections from bare async handlers — without the wrap a 403 becomes an
// unhandled rejection instead of flowing to the central error handler.
export const requirePair = asyncHandler(async (_req, _res, next) => {
  const userId = currentUserId();
  const user = await UserModel.findById(userId).select('pairId').lean();
  if (!user?.pairId) {
    throw new ForbiddenError('You are not in a pair');
  }
  requestContext.set('pairId', user.pairId.toString());
  next();
});

/** The caller's active pair id, set by requirePair. */
export function currentPairId(): string {
  const pairId = requestContext.get()?.pairId;
  if (!pairId) throw new ForbiddenError('You are not in a pair');
  return pairId;
}
