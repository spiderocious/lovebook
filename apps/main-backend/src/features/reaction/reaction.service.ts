import type { Reaction } from '@lovebook/core';

import { ForbiddenError, NotFoundError } from '@lib/errors.js';
import { Err, Ok, type ServiceResult } from '@lib/result.js';
import { toReaction } from '@lib/serialize.js';
import { postRepo } from '../feed/post.repo.js';

import { reactionRepo } from './reaction.repo.js';

export const reactionService = {
  /** Tap (default) or pick (long-press). Upserts — never a second reaction. */
  async set(input: {
    postId: string;
    pairId: string;
    reactorId: string;
    emoji: string;
  }): Promise<ServiceResult<Reaction>> {
    const post = await postRepo.findById(input.postId);
    if (!post) return Err(new NotFoundError('Post'));
    if (post.pairId.toString() !== input.pairId) return Err(new ForbiddenError('Not your pair'));

    const doc = await reactionRepo.set(input);
    return Ok(toReaction(doc));
  },

  async clear(input: {
    postId: string;
    pairId: string;
    reactorId: string;
  }): Promise<ServiceResult<null>> {
    const post = await postRepo.findById(input.postId);
    if (!post) return Err(new NotFoundError('Post'));
    if (post.pairId.toString() !== input.pairId) return Err(new ForbiddenError('Not your pair'));

    await reactionRepo.clear(input.postId, input.reactorId);
    return Ok(null);
  },
};
