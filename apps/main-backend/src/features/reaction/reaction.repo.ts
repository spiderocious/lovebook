import mongoose from 'mongoose';

import { ReactionModel, type ReactionDoc } from '../../models/reaction.model.js';

const oid = (id: string): mongoose.Types.ObjectId => new mongoose.Types.ObjectId(id);

export const reactionRepo = {
  /** Upsert the single reaction for (postId, reactorId) — one per person per post. */
  async set(input: {
    postId: string;
    pairId: string;
    reactorId: string;
    emoji: string;
  }): Promise<ReactionDoc> {
    const doc = await ReactionModel.findOneAndUpdate(
      { postId: oid(input.postId), reactorId: oid(input.reactorId) },
      {
        $set: { emoji: input.emoji },
        $setOnInsert: { pairId: oid(input.pairId) },
      },
      { upsert: true, new: true },
    ).exec();
    return doc as ReactionDoc;
  },

  clear: (postId: string, reactorId: string): Promise<unknown> =>
    ReactionModel.deleteOne({ postId: oid(postId), reactorId: oid(reactorId) }).exec(),
};
