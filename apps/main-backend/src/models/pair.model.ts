import mongoose, { type InferSchemaType, type Model, type Types } from 'mongoose';

import { PAIR_STATUSES } from '@lovebook/core';

const { Schema, model, models } = mongoose;

const pairSchema = new Schema(
  {
    memberIds: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      required: true,
      index: true,
    },
    status: { type: String, enum: PAIR_STATUSES, required: true, default: 'pending', index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type PairDoc = InferSchemaType<typeof pairSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const PairModel = (models.Pair as Model<PairDoc>) ?? model<PairDoc>('Pair', pairSchema);
