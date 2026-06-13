import mongoose, { type InferSchemaType, type Model, type Types } from 'mongoose';

const { Schema, model, models } = mongoose;

const pushSubscriptionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
  },
  { timestamps: true },
);

export type PushSubscriptionDoc = InferSchemaType<typeof pushSubscriptionSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const PushSubscriptionModel =
  (models.PushSubscription as Model<PushSubscriptionDoc>) ??
  model<PushSubscriptionDoc>('PushSubscription', pushSubscriptionSchema);
