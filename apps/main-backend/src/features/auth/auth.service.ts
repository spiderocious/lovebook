import type { AuthResult, AuthTokens, User } from '@lovebook/core';

import { ConflictError, UnauthorizedError } from '@lib/errors.js';
import { issueTokens, verifyRefresh } from '@lib/jwt.js';
import { hashPassword, verifyPassword } from '@lib/password.js';
import { Err, Ok, type ServiceResult } from '@lib/result.js';
import { toUser } from '@lib/serialize.js';

import { authRepo } from './auth.repo.js';

// Business logic only — no HTTP, no req. Returns ServiceResult<T>; the controller
// unwraps and the central errorHandler renders failures.

export const authService = {
  async register(input: {
    email: string;
    name: string;
    password: string;
  }): Promise<ServiceResult<AuthResult>> {
    if (await authRepo.existsByEmail(input.email)) {
      return Err(new ConflictError('An account with that email already exists'));
    }
    const passwordHash = await hashPassword(input.password);
    const doc = await authRepo.create({
      email: input.email,
      name: input.name,
      passwordHash,
    });
    const tokens = issueTokens(doc._id.toString());
    return Ok({ user: toUser(doc), tokens });
  },

  async login(input: { email: string; password: string }): Promise<ServiceResult<AuthResult>> {
    const doc = await authRepo.findByEmail(input.email);
    if (!doc?.passwordHash || !(await verifyPassword(input.password, doc.passwordHash))) {
      return Err(new UnauthorizedError('Invalid email or password'));
    }
    const tokens = issueTokens(doc._id.toString());
    return Ok({ user: toUser(doc), tokens });
  },

  async refresh(refreshToken: string): Promise<ServiceResult<AuthTokens>> {
    const claims = verifyRefresh(refreshToken);
    const doc = await authRepo.findById(claims.sub);
    if (!doc) return Err(new UnauthorizedError('Account no longer exists'));
    return Ok(issueTokens(doc._id.toString()));
  },

  async me(userId: string): Promise<ServiceResult<User>> {
    const doc = await authRepo.findById(userId);
    if (!doc) return Err(new UnauthorizedError('Account no longer exists'));
    return Ok(toUser(doc));
  },
};
