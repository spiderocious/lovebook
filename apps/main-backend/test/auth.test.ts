import { describe, expect, it } from 'vitest';

import { api, auth, makeUser } from './helpers.js';

describe('auth', () => {
  it('registers a user and returns user + tokens (201)', async () => {
    const res = await api()
      .post('/api/v1/auth/register')
      .send({ email: 'a@test.test', name: 'Ada', password: 'Password123!' });

    expect(res.status).toBe(201);
    expect(res.body.data.user).toMatchObject({
      email: 'a@test.test',
      name: 'Ada',
      avatarKey: null,
      pairId: null,
      quietHours: null,
    });
    expect(typeof res.body.data.user.id).toBe('string');
    expect(typeof res.body.data.tokens.access_token).toBe('string');
    expect(typeof res.body.data.tokens.refresh_token).toBe('string');
  });

  it('rejects a duplicate email with 409 conflict', async () => {
    await api()
      .post('/api/v1/auth/register')
      .send({ email: 'dup@test.test', name: 'A', password: 'Password123!' });
    const res = await api()
      .post('/api/v1/auth/register')
      .send({ email: 'dup@test.test', name: 'B', password: 'Password123!' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('conflict');
  });

  it('rejects a short password with 400 validation_error + field_errors', async () => {
    const res = await api()
      .post('/api/v1/auth/register')
      .send({ email: 'x@test.test', name: 'X', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('validation_error');
    expect(res.body.error.field_errors).toHaveProperty('password');
  });

  it('logs in with correct credentials', async () => {
    const u = await makeUser('Login');
    const res = await api()
      .post('/api/v1/auth/login')
      .send({ email: u.email, password: 'Password123!' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.id).toBe(u.id);
  });

  it('rejects bad credentials with 401', async () => {
    const u = await makeUser();
    const res = await api()
      .post('/api/v1/auth/login')
      .send({ email: u.email, password: 'WrongPassword1' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('unauthorized');
  });

  it('refresh returns the ky-client-pinned shape { access_token, refresh_token }', async () => {
    const u = await makeUser();
    const res = await api().post('/api/v1/auth/refresh').send({ refresh_token: u.refreshToken });

    expect(res.status).toBe(200);
    expect(typeof res.body.data.access_token).toBe('string');
    expect(typeof res.body.data.refresh_token).toBe('string');
  });

  it('GET /me requires auth and returns the profile', async () => {
    const u = await makeUser('Me');
    const noAuth = await api().get('/api/v1/auth/me');
    expect(noAuth.status).toBe(401);

    const res = await api().get('/api/v1/auth/me').set('Authorization', auth(u.accessToken));
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(u.id);
  });
});
