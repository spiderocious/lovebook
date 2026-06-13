import { describe, expect, it } from 'vitest';

import { api, auth, makeUser, pairUp } from './helpers.js';

describe('pairing', () => {
  it('mints an invite (code + pairId + expiry)', async () => {
    const a = await makeUser('Ada');
    const res = await api().post('/api/v1/pair/invite').set('Authorization', auth(a.accessToken));

    expect(res.status).toBe(201);
    expect(res.body.data.code).toMatch(/^[A-Z0-9]{6}$/);
    expect(typeof res.body.data.pairId).toBe('string');
    expect(typeof res.body.data.expiresAt).toBe('string');
  });

  it('lookup previews the initiator by code and by pairId link', async () => {
    const a = await makeUser('Ada');
    const invite = await api().post('/api/v1/pair/invite').set('Authorization', auth(a.accessToken));
    const { code, pairId } = invite.body.data;

    const b = await makeUser('Ben');
    const byCode = await api()
      .get(`/api/v1/pair/lookup/${code}`)
      .set('Authorization', auth(b.accessToken));
    expect(byCode.status).toBe(200);
    expect(byCode.body.data.initiator.name).toBe('Ada');

    const byLink = await api()
      .get(`/api/v1/pair/lookup/${pairId}`)
      .set('Authorization', auth(b.accessToken));
    expect(byLink.status).toBe(200);
    expect(byLink.body.data.initiator.id).toBe(a.id);
  });

  it('claims and locks the pair (both members active)', async () => {
    const a = await makeUser('Ada');
    const b = await makeUser('Ben');
    await pairUp(a, b);

    const pairA = await api().get('/api/v1/pair').set('Authorization', auth(a.accessToken));
    const pairB = await api().get('/api/v1/pair').set('Authorization', auth(b.accessToken));

    expect(pairA.body.data.status).toBe('active');
    expect(pairA.body.data.members).toHaveLength(2);
    expect(pairB.body.data.id).toBe(pairA.body.data.id);
  });

  it('rejects claiming your own invite (403)', async () => {
    const a = await makeUser('Ada');
    const invite = await api().post('/api/v1/pair/invite').set('Authorization', auth(a.accessToken));
    const res = await api()
      .post('/api/v1/pair/claim')
      .set('Authorization', auth(a.accessToken))
      .send({ ref: invite.body.data.code });

    expect(res.status).toBe(403);
  });

  it('prevents double-pairing (409 on invite when already paired)', async () => {
    const a = await makeUser('Ada');
    const b = await makeUser('Ben');
    await pairUp(a, b);

    const res = await api().post('/api/v1/pair/invite').set('Authorization', auth(a.accessToken));
    expect(res.status).toBe(409);
  });

  it('returns not_found for a bogus invite (no enumeration leak)', async () => {
    const b = await makeUser('Ben');
    const res = await api()
      .get('/api/v1/pair/lookup/ZZZZZZ')
      .set('Authorization', auth(b.accessToken));
    expect(res.status).toBe(404);
  });

  it('leaves and archives the pair; both become unpaired and see it in archives', async () => {
    const a = await makeUser('Ada');
    const b = await makeUser('Ben');
    await pairUp(a, b);

    const leave = await api().post('/api/v1/pair/leave').set('Authorization', auth(a.accessToken));
    expect(leave.status).toBe(200);

    const currentA = await api().get('/api/v1/pair').set('Authorization', auth(a.accessToken));
    const currentB = await api().get('/api/v1/pair').set('Authorization', auth(b.accessToken));
    expect(currentA.body.data).toBeNull();
    expect(currentB.body.data).toBeNull();

    const archives = await api()
      .get('/api/v1/pair/archives')
      .set('Authorization', auth(a.accessToken));
    expect(archives.body.data).toHaveLength(1);
    expect(archives.body.data[0].status).toBe('archived');
  });

  it('allows re-pairing after leaving', async () => {
    const a = await makeUser('Ada');
    const b = await makeUser('Ben');
    await pairUp(a, b);
    await api().post('/api/v1/pair/leave').set('Authorization', auth(a.accessToken));

    const c = await makeUser('Cy');
    const newPair = await pairUp(a, c);
    expect(typeof newPair).toBe('string');
    const current = await api().get('/api/v1/pair').set('Authorization', auth(a.accessToken));
    expect(current.body.data.status).toBe('active');
  });
});
