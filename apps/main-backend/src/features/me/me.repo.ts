import mongoose from 'mongoose';

import { PostModel } from '../../models/post.model.js';
import { ReactionModel } from '../../models/reaction.model.js';
import { PushSubscriptionModel } from '../../models/push-subscription.model.js';
import { UserModel, type UserDoc } from '../../models/user.model.js';

const oid = (id: string): mongoose.Types.ObjectId => new mongoose.Types.ObjectId(id);

interface UpdateFields {
  name?: string;
  avatarKey?: string | null;
  quietHours?: { start: string; end: string; tz: string } | null;
}

export const meRepo = {
  findById: (id: string): Promise<UserDoc | null> => UserModel.findById(id).exec(),

  update: (id: string, fields: UpdateFields): Promise<UserDoc | null> =>
    UserModel.findByIdAndUpdate(id, { $set: fields }, { new: true }).exec(),

  /**
   * Account deletion (PRD §10): remove the user's OWN posts + reactions, their
   * push subs, and the user record. The ex-partner keeps their copy of the
   * shared history — so posts authored by the partner are NOT touched, even
   * inside a shared pair. The pair is left archived for the partner.
   */
  async deleteOwnData(userId: string): Promise<void> {
    const id = oid(userId);
    await ReactionModel.deleteMany({ reactorId: id }).exec();
    await PostModel.deleteMany({ authorId: id }).exec();
    await PushSubscriptionModel.deleteMany({ userId: id }).exec();
    await UserModel.deleteOne({ _id: id }).exec();
  },
};
