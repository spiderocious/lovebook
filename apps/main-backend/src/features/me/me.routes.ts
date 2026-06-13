import { Router, type IRouter } from 'express';

import { updateMeBodySchema } from '@lovebook/core';

import { asyncHandler } from '@lib/http/asyncHandler.js';
import { ResponseUtil } from '@lib/response.js';
import { unwrap } from '@lib/result.js';
import { currentUserId, requireAuth } from '@middlewares/auth.middleware.js';

import { meService } from './me.service.js';

const router: IRouter = Router();

router.use(requireAuth);

router.patch(
  '/',
  asyncHandler(async (req, res) => {
    const body = updateMeBodySchema.parse(req.body);
    const user = unwrap(await meService.update(currentUserId(), body));
    return ResponseUtil.ok(res, user);
  }),
);

router.delete(
  '/',
  asyncHandler(async (_req, res) => {
    unwrap(await meService.deleteAccount(currentUserId()));
    return ResponseUtil.noContent(res);
  }),
);

export default router;
