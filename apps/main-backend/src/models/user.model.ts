import mongoose, { type InferSchemaType, type Model, type Types } from 'mongoose';

// mongoose is CommonJS — under NodeNext ESM only the default export is reliable;
// named value imports (Schema/model/models) fail at runtime. Destructure them.
const { Schema, model, models } = mongoose;

const quietHoursSchema = new Schema(
  {
    start: { type: String, required: true },
    end: { type: String, required: true },
    tz: { type: String, required: true },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: false },
    name: { type: String, required: true },
    avatarKey: { type: String, default: null },
    pairId: { type: Schema.Types.ObjectId, ref: 'Pair', default: null, index: true },
    quietHours: { type: quietHoursSchema, default: null },
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof userSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const UserModel = (models.User as Model<UserDoc>) ?? model<UserDoc>('User', userSchema);
