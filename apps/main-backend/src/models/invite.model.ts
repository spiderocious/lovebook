import mongoose, { type InferSchemaType, type Model, type Types } from 'mongoose';

const { Schema, model, models } = mongoose;

const INVITE_STATUSES = ['live', 'claimed', 'expired', 'cancelled'] as const;

const inviteSchema = new Schema(
  {
    // No field-level index here — the partial-unique index on `code` is declared
    // below; declaring both produces a duplicate-index warning.
    code: { type: String, required: true },
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
// One *live* invite per creator — the DB-level guard that collapses a concurrent
// double-invite race (BUG-02). The read-then-write in createInvite isn't atomic,
// so the loser hits an 11000 duplicate-key error and is retried into the
// existing invite by the service.
inviteSchema.index(
  { createdBy: 1 },
  { unique: true, partialFilterExpression: { status: 'live' } },
);

export type InviteDoc = InferSchemaType<typeof inviteSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const InviteModel =
  (models.Invite as Model<InviteDoc>) ?? model<InviteDoc>('Invite', inviteSchema);
