import mongoose, { type ClientSession } from 'mongoose';

import { InviteModel, type InviteDoc } from '../../models/invite.model.js';
import { PairModel, type PairDoc } from '../../models/pair.model.js';
import { UserModel, type UserDoc } from '../../models/user.model.js';

const oid = (id: string): mongoose.Types.ObjectId => new mongoose.Types.ObjectId(id);

export const pairRepo = {
  // ── Users ──
  findUser: (id: string): Promise<UserDoc | null> => UserModel.findById(id).exec(),

  findUsers: (ids: mongoose.Types.ObjectId[]): Promise<UserDoc[]> =>
    UserModel.find({ _id: { $in: ids } }).exec(),

  // ── Pairs ──
  createPendingPair: (createdBy: string): Promise<PairDoc> =>
    PairModel.create({ memberIds: [oid(createdBy)], status: 'pending', createdBy: oid(createdBy) }),

  findPair: (id: string): Promise<PairDoc | null> => PairModel.findById(id).exec(),

  findActivePairForUser: (userId: string): Promise<PairDoc | null> =>
    PairModel.findOne({ memberIds: oid(userId), status: 'active' }).exec(),

  findArchivedPairsForUser: (userId: string): Promise<PairDoc[]> =>
    PairModel.find({ memberIds: oid(userId), status: 'archived' }).sort({ archivedAt: -1 }).exec(),

  // ── Invites ──
  createInvite: (input: {
    code: string;
    pairId: mongoose.Types.ObjectId;
    createdBy: string;
    expiresAt: Date;
  }): Promise<InviteDoc> =>
    InviteModel.create({
      code: input.code,
      pairId: input.pairId,
      createdBy: oid(input.createdBy),
      expiresAt: input.expiresAt,
      status: 'live',
    }),

  findLiveInviteByCode: (code: string): Promise<InviteDoc | null> =>
    InviteModel.findOne({ code: code.toUpperCase(), status: 'live' }).exec(),

  findLiveInviteByPairId: (pairId: string): Promise<InviteDoc | null> =>
    InviteModel.findOne({ pairId: oid(pairId), status: 'live' }).exec(),

  findLiveInviteByCreator: (userId: string): Promise<InviteDoc | null> =>
    InviteModel.findOne({ createdBy: oid(userId), status: 'live' }).exec(),

  // ── Transaction helper ──
  withTransaction: <T>(fn: (session: ClientSession) => Promise<T>): Promise<T> =>
    PairModel.db.transaction(fn),

  // ── Atomic-claim primitives (used inside a transaction OR a guarded CAS) ──

  /** Set a user's pairId only if they are currently unpaired. Returns true on success. */
  claimUserIfUnpaired: async (
    userId: string,
    pairId: mongoose.Types.ObjectId,
    session?: ClientSession,
  ): Promise<boolean> => {
    const res = await UserModel.updateOne(
      { _id: oid(userId), pairId: null },
      { $set: { pairId } },
      session ? { session } : {},
    ).exec();
    return res.modifiedCount === 1;
  },

  setUserPair: (
    userId: mongoose.Types.ObjectId,
    pairId: mongoose.Types.ObjectId | null,
    session?: ClientSession,
  ): Promise<unknown> =>
    UserModel.updateOne(
      { _id: userId },
      { $set: { pairId } },
      session ? { session } : {},
    ).exec(),

  activatePair: (
    pairId: mongoose.Types.ObjectId,
    members: mongoose.Types.ObjectId[],
    session?: ClientSession,
  ): Promise<unknown> =>
    PairModel.updateOne(
      { _id: pairId },
      { $set: { status: 'active', memberIds: members } },
      session ? { session } : {},
    ).exec(),

  archivePair: (
    pairId: mongoose.Types.ObjectId,
    archivedAt: Date,
    session?: ClientSession,
  ): Promise<unknown> =>
    PairModel.updateOne(
      { _id: pairId },
      { $set: { status: 'archived', archivedAt } },
      session ? { session } : {},
    ).exec(),

  markInviteClaimed: (
    inviteId: mongoose.Types.ObjectId,
    claimedAt: Date,
    session?: ClientSession,
  ): Promise<unknown> =>
    InviteModel.updateOne(
      { _id: inviteId },
      { $set: { status: 'claimed', claimedAt } },
      session ? { session } : {},
    ).exec(),

  cancelLiveInvitesForPair: (
    pairId: mongoose.Types.ObjectId,
    session?: ClientSession,
  ): Promise<unknown> =>
    InviteModel.updateMany(
      { pairId, status: 'live' },
      { $set: { status: 'cancelled' } },
      session ? { session } : {},
    ).exec(),

  deletePair: (pairId: mongoose.Types.ObjectId, session?: ClientSession): Promise<unknown> =>
    PairModel.deleteOne({ _id: pairId }, session ? { session } : {}).exec(),
};
