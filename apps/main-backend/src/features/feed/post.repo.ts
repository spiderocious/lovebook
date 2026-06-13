import mongoose from 'mongoose';

import type { CreatePostBody } from '@lovebook/core';

import { PostModel, type PostDoc } from '../../models/post.model.js';
import { ReactionModel, type ReactionDoc } from '../../models/reaction.model.js';

const oid = (id: string): mongoose.Types.ObjectId => new mongoose.Types.ObjectId(id);

export const postRepo = {
  create: (input: {
    pairId: string;
    authorId: string;
    body: CreatePostBody;
  }): Promise<PostDoc> => {
    const { pairId, authorId, body } = input;
    return PostModel.create({
      pairId: oid(pairId),
      authorId: oid(authorId),
      type: body.type,
      text: body.type === 'text' ? body.text : null,
      mediaKey: body.type === 'text' ? null : body.mediaKey,
      durationMs: body.type === 'voice' ? body.durationMs : null,
    });
  },

  findById: (id: string): Promise<PostDoc | null> => PostModel.findById(id).exec(),

  /**
   * Cursor-paginated feed for a pair: newest first, cursor on _id (never offset).
   * Fetches limit+1 to compute hasMore.
   */
  async page(input: {
    pairId: string;
    cursor: string | null;
    limit: number;
  }): Promise<{ posts: PostDoc[]; nextCursor: string | null; hasMore: boolean }> {
    const { pairId, cursor, limit } = input;
    const filter: mongoose.FilterQuery<PostDoc> = { pairId: oid(pairId) };
    if (cursor && mongoose.Types.ObjectId.isValid(cursor)) {
      filter._id = { $lt: oid(cursor) };
    }
    const docs = await PostModel.find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .exec();

    const hasMore = docs.length > limit;
    const posts = hasMore ? docs.slice(0, limit) : docs;
    const last = posts.at(-1);
    return {
      posts,
      nextCursor: hasMore && last ? last._id.toString() : null,
      hasMore,
    };
  },

  /** All reactions for a set of posts, grouped by postId (max one per member). */
  async reactionsByPostIds(
    postIds: mongoose.Types.ObjectId[],
  ): Promise<Map<string, ReactionDoc[]>> {
    const docs = await ReactionModel.find({ postId: { $in: postIds } }).exec();
    const map = new Map<string, ReactionDoc[]>();
    for (const doc of docs) {
      const key = doc.postId.toString();
      const list = map.get(key) ?? [];
      list.push(doc);
      map.set(key, list);
    }
    return map;
  },

  reactionForPost: (postId: string): Promise<ReactionDoc | null> =>
    ReactionModel.findOne({ postId: oid(postId) }).exec(),
};
