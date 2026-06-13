import { UserModel, type UserDoc } from '../../models/user.model.js';

// Repository: the only layer that touches the Mongoose model for users.
// Services depend on these functions, never on Mongoose directly.
export const authRepo = {
  findByEmail: (email: string): Promise<UserDoc | null> =>
    UserModel.findOne({ email: email.toLowerCase() }).exec(),

  findById: (id: string): Promise<UserDoc | null> => UserModel.findById(id).exec(),

  create: (input: { email: string; name: string; passwordHash: string }): Promise<UserDoc> =>
    UserModel.create({ ...input, email: input.email.toLowerCase() }),

  existsByEmail: async (email: string): Promise<boolean> =>
    (await UserModel.exists({ email: email.toLowerCase() })) !== null,
};
