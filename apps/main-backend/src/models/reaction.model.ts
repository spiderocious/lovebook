import { Schema, model, models, type InferSchemaType, type Model, type Types } from 'mongoose';

const reactionSchema = new Schema(
  {
    postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
    pairId: { type: Schema.Types.ObjectId, ref: 'Pair', required: true },
    reactorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    emoji: { type: String, required: true },
  },
  { timestamps: true },
);

// One reaction per person per post — a re-tap upserts, never duplicates.
reactionSchema.index({ postId: 1, reactorId: 1 }, { unique: true });

export type ReactionDoc = InferSchemaType<typeof reactionSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const ReactionModel =
  (models.Reaction as Model<ReactionDoc>) ?? model<ReactionDoc>('Reaction', reactionSchema);
