import { Router, type IRouter } from 'express';

import { createPostBodySchema, setReactionBodySchema } from '@lovebook/core';
import { z } from 'zod';

import { asyncHandler } from '@lib/http/asyncHandler.js';
import { ResponseUtil } from '@lib/response.js';
import { unwrap } from '@lib/result.js';
import { currentUserId, requireAuth } from '@middlewares/auth.middleware.js';
import { currentPairId, requirePair } from '@middlewares/requirePair.middleware.js';

import { mediaService } from './media.service.js';
import { postService } from './post.service.js';
import { reactionService } from '../reaction/reaction.service.js';

const objectIdParam = z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid id');
const cursorQuery = z.string().regex(/^[a-f0-9]{24}$/i).optional();
const limitQuery = z.coerce.number().int().min(1).max(50).optional();
const extQuery = z.string().regex(/^[a-z0-9]{1,8}$/i, 'Invalid extension');

// ── /api/v1/feed ──────────────────────────────────────────────────────────────
export const feedRouter: IRouter = Router();
feedRouter.use(requireAuth, requirePair);

feedRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const cursor = cursorQuery.parse(req.query.cursor) ?? null;
    const limit = limitQuery.parse(req.query.limit);
    const page = unwrap(
      await postService.feed({ pairId: currentPairId(), cursor, ...(limit ? { limit } : {}) }),
    );
    return ResponseUtil.ok(res, page);
  }),
);

// ── /api/v1/posts ─────────────────────────────────────────────────────────────
export const postsRouter: IRouter = Router();
postsRouter.use(requireAuth, requirePair);

postsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = createPostBodySchema.parse(req.body);
    const post = unwrap(
      await postService.create({ pairId: currentPairId(), authorId: currentUserId(), body }),
    );
    return ResponseUtil.created(res, post);
  }),
);

postsRouter.get(
  '/:id/media',
  asyncHandler(async (req, res) => {
    const postId = objectIdParam.parse(req.params.id);
    const uri = unwrap(await mediaService.viewUri({ postId, pairId: currentPairId() }));
    return ResponseUtil.ok(res, uri);
  }),
);

postsRouter.put(
  '/:id/reaction',
  asyncHandler(async (req, res) => {
    const postId = objectIdParam.parse(req.params.id);
    const body = setReactionBodySchema.parse(req.body);
    const reaction = unwrap(
      await reactionService.set({
        postId,
        pairId: currentPairId(),
        reactorId: currentUserId(),
        emoji: body.emoji,
      }),
    );
    return ResponseUtil.ok(res, reaction);
  }),
);

postsRouter.delete(
  '/:id/reaction',
  asyncHandler(async (req, res) => {
    const postId = objectIdParam.parse(req.params.id);
    unwrap(
      await reactionService.clear({
        postId,
        pairId: currentPairId(),
        reactorId: currentUserId(),
      }),
    );
    return ResponseUtil.noContent(res);
  }),
);

// ── /api/v1/media ─────────────────────────────────────────────────────────────
export const mediaRouter: IRouter = Router();
mediaRouter.use(requireAuth, requirePair);

mediaRouter.get(
  '/upload-uri',
  asyncHandler(async (req, res) => {
    const ext = extQuery.parse(req.query.ext);
    const target = unwrap(await mediaService.uploadTarget(ext));
    return ResponseUtil.ok(res, target);
  }),
);
