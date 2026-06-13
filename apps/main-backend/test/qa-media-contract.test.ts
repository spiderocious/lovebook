// Media access-gate (file-service stubbed) + the seam/contract checks: every
// DTO parsed through the @lovebook/core Zod-shaped expectations.
// See docs/qas/backend-test-plan.md §5.6, §7.
import { afterEach, describe, expect, it, vi } from 'vitest';

import { api, auth, makeUser, pairUp } from './helpers.js';

const BASE = '/api/v1';

function stubFileService(handler: (url: string) => { ok: boolean; status?: number; json?: unknown }) {
  return vi.spyOn(global, 'fetch').mockImplementation(async (input: string | URL | Request) => {
    const url = typeof input === 'string' ? input : input.toString();
    const r = handler(url);
    return {
      ok: r.ok,
      status: r.status ?? (r.ok ? 200 : 500),
      json: async () => r.json ?? {},
    } as Response;
  });
}

afterEach(() => vi.restoreAllMocks());

async function pairedPhoto() {
  const a = await makeUser('A');
  const b = await makeUser('B');
  await pairUp(a, b);
  const post = await api()
    .post(`${BASE}/posts`)
    .set('Authorization', auth(a.accessToken))
    .send({ type: 'photo', mediaKey: 'lovef-photos/x.jpg' });
  return { a, b, postId: post.body.data.id as string };
}

describe('MEDIA — access gate (file-service stubbed)', () => {
  it('MEDIA-01: view uri for own pair photo → 200 {uri, expiresIn}', async () => {
    stubFileService(() => ({ ok: true, json: { uri: 'https://signed.test/v', expires_in: '300s' } }));
    const { a, postId } = await pairedPhoto();
    const res = await api().get(`${BASE}/posts/${postId}/media`).set('Authorization', auth(a.accessToken));
    expect(res.status).toBe(200);
    expect(res.body.data.uri).toBe('https://signed.test/v');
    expect(typeof res.body.data.expiresIn).toBe('string');
  });

  it('MEDIA-02: view uri for a text post (no media) → 404', async () => {
    stubFileService(() => ({ ok: true, json: { uri: 'x', expires_in: '300s' } }));
    const a = await makeUser('A');
    const b = await makeUser('B');
    await pairUp(a, b);
    const text = await api()
      .post(`${BASE}/posts`)
      .set('Authorization', auth(a.accessToken))
      .send({ type: 'text', text: 'hi' });
    const res = await api()
      .get(`${BASE}/posts/${text.body.data.id}/media`)
      .set('Authorization', auth(a.accessToken));
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('not_found');
  });

  it('MEDIA-03: view uri for non-existent post → 404', async () => {
    const a = await makeUser('A');
    const b = await makeUser('B');
    await pairUp(a, b);
    const res = await api()
      .get(`${BASE}/posts/6a2d3082075eb8d66abe46b6/media`)
      .set('Authorization', auth(a.accessToken));
    expect(res.status).toBe(404);
  });

  it('MEDIA-04: cross-pair view uri → 403 forbidden (the gate)', async () => {
    stubFileService(() => ({ ok: true, json: { uri: 'x', expires_in: '300s' } }));
    const { postId } = await pairedPhoto();
    const c = await makeUser('C');
    const d = await makeUser('D');
    await pairUp(c, d);
    const res = await api().get(`${BASE}/posts/${postId}/media`).set('Authorization', auth(c.accessToken));
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('forbidden');
  });

  it('MEDIA-05: upload-uri valid ext → 200 {key, uri, expiresIn}', async () => {
    stubFileService(() => ({ ok: true, json: { key: 'lovef-k', uri: 'https://up.test', expires_in: '600s' } }));
    const a = await makeUser('A');
    const b = await makeUser('B');
    await pairUp(a, b);
    const res = await api().get(`${BASE}/media/upload-uri?ext=jpg`).set('Authorization', auth(a.accessToken));
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ key: 'lovef-k', uri: 'https://up.test' });
    expect(typeof res.body.data.expiresIn).toBe('string');
  });

  it('MEDIA-05b: upload-uri bad ext (symbols) → 400', async () => {
    const a = await makeUser('A');
    const b = await makeUser('B');
    await pairUp(a, b);
    const res = await api().get(`${BASE}/media/upload-uri?ext=..%2Fevil`).set('Authorization', auth(a.accessToken));
    expect(res.status).toBe(400);
  });

  it('MEDIA-07: file-service 5xx → mapped error envelope, not a 500 stack leak', async () => {
    stubFileService(() => ({ ok: false, status: 503 }));
    const { a, postId } = await pairedPhoto();
    const res = await api().get(`${BASE}/posts/${postId}/media`).set('Authorization', auth(a.accessToken));
    expect(res.status).toBeGreaterThanOrEqual(500);
    expect(res.body).toHaveProperty('error.code');
    expect(JSON.stringify(res.body)).not.toContain('at '); // no stack trace
  });
});

// ── 7. Seam / contract — parse DTOs against expected shapes ───────────────────
describe('SEAM — contract shapes', () => {
  const isNullable = (v: unknown, ...types: string[]) =>
    v === null || types.includes(typeof v);

  it('User DTO: nullable fields are T|null, never omitted', async () => {
    const u = await makeUser();
    const me = (await api().get(`${BASE}/auth/me`).set('Authorization', auth(u.accessToken))).body.data;
    expect(Object.keys(me).sort()).toEqual(['avatarKey', 'email', 'id', 'name', 'pairId', 'quietHours'].sort());
    expect(isNullable(me.avatarKey, 'string')).toBe(true);
    expect(isNullable(me.pairId, 'string')).toBe(true);
    expect(me.quietHours === null || typeof me.quietHours === 'object').toBe(true);
  });

  it('Auth refresh shape pinned: { data: { access_token, refresh_token } }', async () => {
    const u = await makeUser();
    const res = await api().post(`${BASE}/auth/refresh`).send({ refresh_token: u.refreshToken });
    expect(Object.keys(res.body.data).sort()).toEqual(['access_token', 'refresh_token']);
  });

  it('FeedPage shape: posts[], nextCursor string|null, hasMore boolean', async () => {
    const a = await makeUser('A');
    const b = await makeUser('B');
    await pairUp(a, b);
    await api().post(`${BASE}/posts`).set('Authorization', auth(a.accessToken)).send({ type: 'text', text: 'hi' });
    const page = (await api().get(`${BASE}/feed`).set('Authorization', auth(a.accessToken))).body.data;
    expect(Object.keys(page).sort()).toEqual(['hasMore', 'nextCursor', 'posts'].sort());
    expect(Array.isArray(page.posts)).toBe(true);
    expect(typeof page.hasMore).toBe('boolean');
    expect(isNullable(page.nextCursor, 'string')).toBe(true);
  });

  it('Post DTO: all nullable fields present, createdAt ISO', async () => {
    const a = await makeUser('A');
    const b = await makeUser('B');
    await pairUp(a, b);
    const post = (await api()
      .post(`${BASE}/posts`)
      .set('Authorization', auth(a.accessToken))
      .send({ type: 'text', text: 'hi' })).body.data;
    expect(Object.keys(post).sort()).toEqual(
      ['authorId', 'createdAt', 'durationMs', 'id', 'mediaKey', 'reaction', 'text', 'type'].sort(),
    );
    expect(post.mediaKey).toBeNull();
    expect(post.durationMs).toBeNull();
    expect(post.reaction).toBeNull();
    expect(post.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T.*Z$/);
  });

  it('Pair DTO: status enum, members {id,name,avatarKey}, archivedAt ISO|null', async () => {
    const a = await makeUser('A');
    const b = await makeUser('B');
    await pairUp(a, b);
    const pair = (await api().get(`${BASE}/pair`).set('Authorization', auth(a.accessToken))).body.data;
    expect(['pending', 'active', 'archived']).toContain(pair.status);
    expect(pair.archivedAt).toBeNull();
    for (const m of pair.members) {
      expect(Object.keys(m).sort()).toEqual(['avatarKey', 'id', 'name'].sort());
    }
  });

  it('Reaction DTO: { emoji, reactorId, createdAt }', async () => {
    const a = await makeUser('A');
    const b = await makeUser('B');
    await pairUp(a, b);
    const post = await api().post(`${BASE}/posts`).set('Authorization', auth(a.accessToken)).send({ type: 'text', text: 'hi' });
    const rx = (await api()
      .put(`${BASE}/posts/${post.body.data.id}/reaction`)
      .set('Authorization', auth(a.accessToken))
      .send({ emoji: '🔥' })).body.data;
    expect(Object.keys(rx).sort()).toEqual(['createdAt', 'emoji', 'reactorId'].sort());
  });
});
