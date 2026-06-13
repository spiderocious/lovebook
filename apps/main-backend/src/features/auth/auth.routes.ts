import { Router, type IRouter } from 'express';

import { asyncHandler } from '@lib/http/asyncHandler.js';
import { ResponseUtil } from '@lib/response.js';
import { unwrap } from '@lib/result.js';
import { currentUserId, requireAuth } from '@middlewares/auth.middleware.js';

import { authService } from './auth.service.js';
import { LoginBody, RefreshBody, RegisterBody } from './auth.schema.js';

const router: IRouter = Router();

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const body = RegisterBody.parse(req.body);
    const result = unwrap(await authService.register(body));
    return ResponseUtil.created(res, result);
  }),
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const body = LoginBody.parse(req.body);
    const result = unwrap(await authService.login(body));
    return ResponseUtil.ok(res, result);
  }),
);

router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const body = RefreshBody.parse(req.body);
    const tokens = unwrap(await authService.refresh(body.refresh_token));
    return ResponseUtil.ok(res, tokens);
  }),
);

router.post(
  '/logout',
  asyncHandler(async (_req, res) => {
    // Stateless JWT: logout is client-side (drop tokens). Endpoint kept for
    // symmetry + future refresh-token revocation.
    return ResponseUtil.noContent(res);
  }),
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (_req, res) => {
    const user = unwrap(await authService.me(currentUserId()));
    return ResponseUtil.ok(res, user);
  }),
);

export default router;
