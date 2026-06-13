import type mongoose from 'mongoose';

import type { CreatePostBody, FeedPage, Post } from '@lovebook/core';

import { logger } from '@lib/logger.js';
import { Ok, type ServiceResult } from '@lib/result.js';
import { toPost } from '@lib/serialize.js';
import { PairModel } from '../../models/pair.model.js';
import { UserModel } from '../../models/user.model.js';
import { pushService } from '../push/push.service.js';

import { postRepo } from './post.repo.js';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export const postService = {
  async feed(input: {
    pairId: string;
    cursor: string | null;
    limit?: number;
  }): Promise<ServiceResult<FeedPage>> {
    const limit = Math.min(Math.max(input.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
    const { posts, nextCursor, hasMore } = await postRepo.page({
      pairId: input.pairId,
      cursor: input.cursor,
      limit,
    });
    const reactions = await postRepo.reactionsByPostIds(posts.map((p) => p._id));
    const out: Post[] = posts.map((p) => toPost(p, reactions.get(p._id.toString()) ?? []));
    return Ok({ posts: out, nextCursor, hasMore });
  },

  async create(input: {
    pairId: string;
    authorId: string;
    body: CreatePostBody;
  }): Promise<ServiceResult<Post>> {
    const doc = await postRepo.create(input);

    // Best-effort push to the other member — never blocks the response.
    void this.notifyOtherMember(input.pairId, input.authorId).catch((err) => {
      logger.warn({ err }, 'post push notification failed');
    });

    return Ok(toPost(doc, []));
  },

  async notifyOtherMember(pairId: string, authorId: string): Promise<void> {
    const pair = await PairModel.findById(pairId).select('memberIds').lean();
    if (!pair) return;
    const otherId = (pair.memberIds as mongoose.Types.ObjectId[])
      .map((m) => m.toString())
      .find((id) => id !== authorId);
    if (!otherId) return;
    const author = await UserModel.findById(authorId).select('name').lean();
    await pushService.notifyMoment(otherId, author?.name ?? 'Your person');
  },
};
