import { Router, type IRouter } from 'express';

import { pushSubscribeBodySchema, pushUnsubscribeBodySchema } from '@lovebook/core';

import { asyncHandler } from '@lib/http/asyncHandler.js';
import { ResponseUtil } from '@lib/response.js';
import { unwrap } from '@lib/result.js';
import { currentUserId, requireAuth } from '@middlewares/auth.middleware.js';

import { pushService } from './push.service.js';

const router: IRouter = Router();

// Public: the VAPID key the client needs to subscribe.
router.get(
  '/key',
  asyncHandler(async (_req, res) => {
    return ResponseUtil.ok(res, { key: pushService.vapidKey() });
  }),
);

router.use(requireAuth);

router.post(
  '/subscribe',
  asyncHandler(async (req, res) => {
    const body = pushSubscribeBodySchema.parse(req.body);
    const result = unwrap(await pushService.subscribe({ userId: currentUserId(), ...body }));
    return ResponseUtil.created(res, result);
  }),
);

router.post(
  '/unsubscribe',
  asyncHandler(async (req, res) => {
    const body = pushUnsubscribeBodySchema.parse(req.body);
    const result = unwrap(await pushService.unsubscribe(body.endpoint));
    return ResponseUtil.ok(res, result);
  }),
);

export default router;
