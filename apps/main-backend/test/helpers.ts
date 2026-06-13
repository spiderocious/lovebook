import type { Express } from 'express';
import supertest from 'supertest';

import { buildApp } from '../src/app.js';

export const app: Express = buildApp();
export const api = (): supertest.Agent => supertest(app);

export interface TestUser {
  id: string;
  email: string;
  name: string;
  accessToken: string;
  refreshToken: string;
}

let counter = 0;

/** Register a fresh user and return their tokens. */
export async function makeUser(name = 'Test'): Promise<TestUser> {
  counter += 1;
  const email = `user${counter}@test.test`;
  const res = await api()
    .post('/api/v1/auth/register')
    .send({ email, name, password: 'Password123!' });
  if (res.status !== 201) throw new Error(`register failed: ${res.status} ${res.text}`);
  return {
    id: res.body.data.user.id,
    email,
    name,
    accessToken: res.body.data.tokens.access_token,
    refreshToken: res.body.data.tokens.refresh_token,
  };
}

export const auth = (token: string): string => `Bearer ${token}`;

/** Pair two users: A invites, B claims. Returns the active pair id. */
export async function pairUp(a: TestUser, b: TestUser): Promise<string> {
  const invite = await api().post('/api/v1/pair/invite').set('Authorization', auth(a.accessToken));
  const { code, pairId } = invite.body.data as { code: string; pairId: string };
  await api()
    .post('/api/v1/pair/claim')
    .set('Authorization', auth(b.accessToken))
    .send({ ref: code });
  return pairId;
}
