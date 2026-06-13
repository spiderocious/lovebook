import { Schema, model, models, type InferSchemaType, type Model, type Types } from 'mongoose';

const INVITE_STATUSES = ['live', 'claimed', 'expired', 'cancelled'] as const;

const inviteSchema = new Schema(
  {
    code: { type: String, required: true, index: true },
    pairId: { type: Schema.Types.ObjectId, ref: 'Pair', required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: INVITE_STATUSES, required: true, default: 'live' },
    expiresAt: { type: Date, required: true },
    claimedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// TTL: Mongo reaps expired invites automatically once expiresAt passes.
inviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// Only one *live* invite may hold a given code at a time.
inviteSchema.index(
  { code: 1 },
  { unique: true, partialFilterExpression: { status: 'live' } },
);

export type InviteDoc = InferSchemaType<typeof inviteSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const InviteModel =
  (models.Invite as Model<InviteDoc>) ?? model<InviteDoc>('Invite', inviteSchema);
