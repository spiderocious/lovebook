import { Schema, model, models, type InferSchemaType, type Model, type Types } from 'mongoose';

import { POST_TYPES } from '@lovebook/core';

const postSchema = new Schema(
  {
    pairId: { type: Schema.Types.ObjectId, ref: 'Pair', required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: POST_TYPES, required: true },
    text: { type: String, default: null },
    mediaKey: { type: String, default: null },
    durationMs: { type: Number, default: null },
  },
  // Posts are immutable (PRD: no edit). createdAt only; no updatedAt churn.
  { timestamps: { createdAt: true, updatedAt: false } },
);

// The feed query: newest-first within a pair, cursor on _id.
postSchema.index({ pairId: 1, _id: -1 });

export type PostDoc = InferSchemaType<typeof postSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
};

export const PostModel = (models.Post as Model<PostDoc>) ?? model<PostDoc>('Post', postSchema);
