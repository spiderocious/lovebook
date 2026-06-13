import jwt, { type SignOptions } from 'jsonwebtoken';

import { env } from '../env.js';
import { UnauthorizedError } from './errors.js';

export interface AccessClaims {
  sub: string; // userId
  type: 'access';
}
export interface RefreshClaims {
  sub: string; // userId
  type: 'refresh';
}

export interface IssuedTokens {
  access_token: string;
  refresh_token: string;
}

export function issueTokens(userId: string): IssuedTokens {
  const access_token = jwt.sign({ sub: userId, type: 'access' } satisfies AccessClaims, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as SignOptions);
  const refresh_token = jwt.sign(
    { sub: userId, type: 'refresh' } satisfies RefreshClaims,
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as SignOptions,
  );
  return { access_token, refresh_token };
}

export function verifyAccess(token: string): AccessClaims {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    if (typeof decoded === 'string' || decoded.type !== 'access' || typeof decoded.sub !== 'string') {
      throw new UnauthorizedError('Invalid token');
    }
    return { sub: decoded.sub, type: 'access' };
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
}

export function verifyRefresh(token: string): RefreshClaims {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
    if (typeof decoded === 'string' || decoded.type !== 'refresh' || typeof decoded.sub !== 'string') {
      throw new UnauthorizedError('Invalid refresh token');
    }
    return { sub: decoded.sub, type: 'refresh' };
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
}
