import type mongoose from 'mongoose';

import type { UpdateMeBody, User } from '@lovebook/core';

import { UnauthorizedError } from '@lib/errors.js';
import { Err, Ok, type ServiceResult } from '@lib/result.js';
import { toUser } from '@lib/serialize.js';
import { PairModel } from '../../models/pair.model.js';
import { UserModel } from '../../models/user.model.js';

import { meRepo } from './me.repo.js';

export const meService = {
  async update(userId: string, body: UpdateMeBody): Promise<ServiceResult<User>> {
    // Only set keys that were provided (PATCH semantics; honours nullable fields).
    const fields: Parameters<typeof meRepo.update>[1] = {};
    if (body.name !== undefined) fields.name = body.name;
    if (body.avatarKey !== undefined) fields.avatarKey = body.avatarKey;
    if (body.quietHours !== undefined) fields.quietHours = body.quietHours;

    const doc = await meRepo.update(userId, fields);
    if (!doc) return Err(new UnauthorizedError('Account no longer exists'));
    return Ok(toUser(doc));
  },

  /**
   * Delete the account. If the user is in an active pair, archive it so the
   * partner keeps a read-only copy of the shared history (PRD §10) and is
   * returned to the unpaired state.
   */
  async deleteAccount(userId: string): Promise<ServiceResult<null>> {
    const user = await meRepo.findById(userId);
    if (!user) return Err(new UnauthorizedError('Account no longer exists'));

    if (user.pairId) {
      const pair = await PairModel.findById(user.pairId).exec();
      if (pair && pair.status === 'active') {
        await PairModel.updateOne(
          { _id: pair._id },
          { $set: { status: 'archived', archivedAt: new Date() } },
        ).exec();
        const others = (pair.memberIds as mongoose.Types.ObjectId[]).filter(
          (m) => m.toString() !== userId,
        );
        await UserModel.updateMany({ _id: { $in: others } }, { $set: { pairId: null } }).exec();
      }
    }

    await meRepo.deleteOwnData(userId);
    return Ok(null);
  },
};
