import mongoose from 'mongoose';

import {
  PushSubscriptionModel,
  type PushSubscriptionDoc,
} from '../../models/push-subscription.model.js';

const oid = (id: string): mongoose.Types.ObjectId => new mongoose.Types.ObjectId(id);

export const pushRepo = {
  upsert: (input: {
    userId: string;
    endpoint: string;
    keys: { p256dh: string; auth: string };
  }): Promise<unknown> =>
    PushSubscriptionModel.updateOne(
      { endpoint: input.endpoint },
      { $set: { userId: oid(input.userId), endpoint: input.endpoint, keys: input.keys } },
      { upsert: true },
    ).exec(),

  removeByEndpoint: (endpoint: string): Promise<unknown> =>
    PushSubscriptionModel.deleteOne({ endpoint }).exec(),

  findForUser: (userId: string): Promise<PushSubscriptionDoc[]> =>
    PushSubscriptionModel.find({ userId: oid(userId) }).exec(),
};
