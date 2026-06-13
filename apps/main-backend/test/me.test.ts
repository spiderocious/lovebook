import { describe, expect, it } from 'vitest';

import { api, auth, makeUser, pairUp } from './helpers.js';

describe('settings (me)', () => {
  it('updates display name and quiet hours', async () => {
    const u = await makeUser('Ada');
    const res = await api()
      .patch('/api/v1/me')
      .set('Authorization', auth(u.accessToken))
      .send({ name: 'Ada Lovelace', quietHours: { start: '22:00', end: '07:00', tz: 'UTC' } });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Ada Lovelace');
    expect(res.body.data.quietHours).toEqual({ start: '22:00', end: '07:00', tz: 'UTC' });
  });

  it('rejects an empty patch (400)', async () => {
    const u = await makeUser();
    const res = await api().patch('/api/v1/me').set('Authorization', auth(u.accessToken)).send({});
    expect(res.status).toBe(400);
  });

  it('deletes the account; the partner keeps the archived pair (PRD §10)', async () => {
    const a = await makeUser('Ada');
    const b = await makeUser('Ben');
    await pairUp(a, b);
    await api().post('/api/v1/posts').set('Authorization', auth(a.accessToken)).send({
      type: 'text',
      text: 'a memory',
    });

    const del = await api().delete('/api/v1/me').set('Authorization', auth(a.accessToken));
    expect(del.status).toBe(204);

    // A is gone.
    const me = await api().get('/api/v1/auth/me').set('Authorization', auth(a.accessToken));
    expect(me.status).toBe(401);

    // B is unpaired but keeps the archived pair.
    const current = await api().get('/api/v1/pair').set('Authorization', auth(b.accessToken));
    expect(current.body.data).toBeNull();
    const archives = await api()
      .get('/api/v1/pair/archives')
      .set('Authorization', auth(b.accessToken));
    expect(archives.body.data).toHaveLength(1);
  });
});

describe('health + push key', () => {
  it('health is public and ok', async () => {
    const res = await api().get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ok');
  });

  it('push key endpoint is public (null when VAPID unset in test)', async () => {
    const res = await api().get('/api/v1/push/key');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('key');
  });
});
