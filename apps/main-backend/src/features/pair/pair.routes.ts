import { Router, type IRouter } from 'express';

import { claimBodySchema, pairRefSchema } from '@lovebook/core';

import { asyncHandler } from '@lib/http/asyncHandler.js';
import { ResponseUtil } from '@lib/response.js';
import { unwrap } from '@lib/result.js';
import { currentUserId, requireAuth } from '@middlewares/auth.middleware.js';

import { pairService } from './pair.service.js';

const router: IRouter = Router();

router.use(requireAuth);

// Specific paths before the bare GET / (current pair).
router.post(
  '/invite',
  asyncHandler(async (_req, res) => {
    const invite = unwrap(await pairService.createInvite(currentUserId()));
    return ResponseUtil.created(res, invite);
  }),
);

router.get(
  '/lookup/:ref',
  asyncHandler(async (req, res) => {
    const ref = pairRefSchema.parse(req.params.ref);
    const preview = unwrap(await pairService.lookup(ref));
    return ResponseUtil.ok(res, preview);
  }),
);

router.post(
  '/claim',
  asyncHandler(async (req, res) => {
    const body = claimBodySchema.parse(req.body);
    const pair = unwrap(await pairService.claim(currentUserId(), body.ref));
    return ResponseUtil.ok(res, pair);
  }),
);

router.post(
  '/leave',
  asyncHandler(async (_req, res) => {
    const result = unwrap(await pairService.leave(currentUserId()));
    return ResponseUtil.ok(res, result);
  }),
);

router.get(
  '/archives',
  asyncHandler(async (_req, res) => {
    const pairs = unwrap(await pairService.archives(currentUserId()));
    return ResponseUtil.ok(res, pairs);
  }),
);

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const pair = unwrap(await pairService.current(currentUserId()));
    return ResponseUtil.ok(res, pair);
  }),
);

export default router;
