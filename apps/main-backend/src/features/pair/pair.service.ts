import mongoose from 'mongoose';

import { INVITE_TTL_MS, type Invite, type InvitePreview, type Pair } from '@lovebook/core';

import { supportsTransactions } from '@lib/db.js';
import { ConflictError, ForbiddenError, NotFoundError } from '@lib/errors.js';
import { generateInviteCode } from '@lib/invite-code.js';
import { Err, Ok, type ServiceResult } from '@lib/result.js';
import { toPair, toPairMember } from '@lib/serialize.js';

import { pairRepo } from './pair.repo.js';

const isObjectId = (s: string): boolean => mongoose.Types.ObjectId.isValid(s) && s.length === 24;

// The pairing state machine (docs/lovebook-plan.md §5):
//   unpaired → POST invite → pair:pending + invite:live
//   pending  → claim (other user) → pair:active (both users.pairId set)
//   active   → leave → pair:archived (both users.pairId = null)
// Invariant: a user holds at most one non-archived pair at a time.

export const pairService = {
  /** Mint a 6-char code + a pending pair the initiator owns. */
  async createInvite(userId: string): Promise<ServiceResult<Invite>> {
    const existing = await pairRepo.findActivePairForUser(userId);
    if (existing) return Err(new ConflictError('You are already in a pair'));

    // Re-invite is idempotent: return the still-live invite if one exists.
    // (The initiator's user.pairId is only set when the pair locks at claim time,
    // so a pending invite never blocks them or counts as "paired".)
    const live = await pairRepo.findLiveInviteByCreator(userId);
    if (live) return Ok(this.inviteDto(live.code, live.pairId.toString(), live.expiresAt));

    const pair = await pairRepo.createPendingPair(userId);
    const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

    // The DB enforces one live invite per code AND one per creator (BUG-02). A
    // duplicate-key (11000) means either a rare code clash (retry a new code) or
    // a concurrent invite from the same user won the race (yield: drop our orphan
    // pending pair and return the winner's invite).
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = generateInviteCode();
      try {
        await pairRepo.createInvite({ code, pairId: pair._id, createdBy: userId, expiresAt });
        return Ok(this.inviteDto(code, pair._id.toString(), expiresAt));
      } catch (err) {
        if ((err as { code?: number }).code !== 11000) throw err;
        const winner = await pairRepo.findLiveInviteByCreator(userId);
        if (winner && winner.pairId.toString() !== pair._id.toString()) {
          await pairRepo.deletePair(pair._id); // discard our orphaned pending pair
          return Ok(this.inviteDto(winner.code, winner.pairId.toString(), winner.expiresAt));
        }
        // else: a plain code collision — loop and try another code.
      }
    }
    await pairRepo.deletePair(pair._id);
    return Err(new ConflictError('Could not allocate an invite code, try again'));
  },

  inviteDto(code: string, pairId: string, expiresAt: Date): Invite {
    return { code, pairId, expiresAt: expiresAt.toISOString() };
  },

  /** Receiver previews who is inviting them (by code or pair-id link). */
  async lookup(ref: string): Promise<ServiceResult<InvitePreview>> {
    const invite = isObjectId(ref)
      ? await pairRepo.findLiveInviteByPairId(ref)
      : await pairRepo.findLiveInviteByCode(ref);
    // Surface every miss as not_found — never reveal claimed/expired vs bad code.
    if (!invite || invite.expiresAt.getTime() < Date.now()) {
      return Err(new NotFoundError('Invite'));
    }
    const initiator = await pairRepo.findUser(invite.createdBy.toString());
    if (!initiator) return Err(new NotFoundError('Invite'));
    return Ok({ initiator: toPairMember(initiator), expiresAt: invite.expiresAt.toISOString() });
  },

  /** Claim an invite → lock the pair. The one operation that must be atomic. */
  async claim(claimerId: string, ref: string): Promise<ServiceResult<Pair>> {
    if (await pairRepo.findActivePairForUser(claimerId)) {
      return Err(new ConflictError('You are already in a pair'));
    }

    const invite = isObjectId(ref)
      ? await pairRepo.findLiveInviteByPairId(ref)
      : await pairRepo.findLiveInviteByCode(ref);
    if (!invite || invite.expiresAt.getTime() < Date.now()) {
      return Err(new NotFoundError('Invite'));
    }
    if (invite.createdBy.toString() === claimerId) {
      return Err(new ForbiddenError('You cannot claim your own invite'));
    }

    const pair = await pairRepo.findPair(invite.pairId.toString());
    if (!pair || pair.status !== 'pending') return Err(new NotFoundError('Invite'));

    const initiatorId = pair.createdBy;
    const claimerOid = new mongoose.Types.ObjectId(claimerId);
    const members = [initiatorId, claimerOid];
    const now = new Date();

    const lock = async (session?: mongoose.ClientSession): Promise<boolean> => {
      // Claimer must still be unpaired at lock time (guards a concurrent claim).
      const claimed = await pairRepo.claimUserIfUnpaired(claimerId, pair._id, session);
      if (!claimed) return false;
      // Initiator must also still be unpaired (they could have paired elsewhere
      // since minting this invite). If not, roll the claimer back.
      const initiatorOk = await pairRepo.claimUserIfUnpaired(
        initiatorId.toString(),
        pair._id,
        session,
      );
      if (!initiatorOk) {
        if (!session) await pairRepo.setUserPair(claimerOid, null);
        return false;
      }
      await pairRepo.activatePair(pair._id, members, session);
      await pairRepo.markInviteClaimed(invite._id, now, session);
      return true;
    };

    let ok: boolean;
    if (supportsTransactions()) {
      ok = await pairRepo.withTransaction(lock);
    } else {
      // Guarded compare-and-set fallback (standalone mongod, no transactions).
      ok = await lock();
    }
    if (!ok) return Err(new ConflictError('You are already in a pair'));

    const memberDocs = await pairRepo.findUsers(members);
    const fresh = await pairRepo.findPair(pair._id.toString());
    return Ok(toPair(fresh ?? pair, memberDocs));
  },

  /** The caller's current active pair (or null). */
  async current(userId: string): Promise<ServiceResult<Pair | null>> {
    const pair = await pairRepo.findActivePairForUser(userId);
    if (!pair) return Ok(null);
    const members = await pairRepo.findUsers(pair.memberIds as mongoose.Types.ObjectId[]);
    return Ok(toPair(pair, members));
  },

  /** Leave the active pair → archive it; both members become unpaired. */
  async leave(userId: string): Promise<ServiceResult<{ archivedPairId: string }>> {
    const pair = await pairRepo.findActivePairForUser(userId);
    if (!pair) return Err(new NotFoundError('Pair'));
    const now = new Date();
    const members = pair.memberIds as mongoose.Types.ObjectId[];

    const run = async (session?: mongoose.ClientSession): Promise<void> => {
      await pairRepo.archivePair(pair._id, now, session);
      for (const m of members) await pairRepo.setUserPair(m, null, session);
    };

    if (supportsTransactions()) {
      await pairRepo.withTransaction(run);
    } else {
      await run();
    }
    return Ok({ archivedPairId: pair._id.toString() });
  },

  /** Read-only past pairs (PRD "Past pairs"). */
  async archives(userId: string): Promise<ServiceResult<Pair[]>> {
    const pairs = await pairRepo.findArchivedPairsForUser(userId);
    const out: Pair[] = [];
    for (const pair of pairs) {
      const members = await pairRepo.findUsers(pair.memberIds as mongoose.Types.ObjectId[]);
      out.push(toPair(pair, members));
    }
    return Ok(out);
  },
};
