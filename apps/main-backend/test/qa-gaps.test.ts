// QA gap suite (Phase 1) — targets the holes the baseline 28 tests leave:
// auth negatives & token lifecycle, settings edges, the seam/contract shapes,
// the per-route pair gate, validation boundaries, and cross-cutting invariants.
// See docs/qas/backend-test-plan.md §5–7.
import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';

import { api, auth, makeUser, pairUp } from './helpers.js';

const BASE = '/api/v1';

// ── 5.1 Auth — negatives & token lifecycle ──────────────────────────────────
describe('AUTH — negatives & token lifecycle', () => {
  it('AUTH-01: no token on protected route → 401', async () => {
    const res = await api().get(`${BASE}/auth/me`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('unauthorized');
  });

  it('AUTH-02: malformed header (not Bearer) → 401', async () => {
    const res = await api().get(`${BASE}/auth/me`).set('Authorization', 'Token abc');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('unauthorized');
  });

  it('AUTH-03: Bearer with garbage token → 401', async () => {
    const res = await api().get(`${BASE}/auth/me`).set('Authorization', 'Bearer not.a.jwt');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('unauthorized');
  });

  it('AUTH-04: expired access token → 401', async () => {
    const expired = jwt.sign(
      { sub: '6a2d3082075eb8d66abe46b6', type: 'access' },
      process.env.JWT_ACCESS_SECRET as string,
      { expiresIn: -10 },
    );
    const res = await api().get(`${BASE}/auth/me`).set('Authorization', auth(expired));
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('unauthorized');
  });

  it('AUTH-05: token signed with wrong secret → 401', async () => {
    const forged = jwt.sign(
      { sub: '6a2d3082075eb8d66abe46b6', type: 'access' },
      'a_completely_different_secret_thats_long_enough',
    );
    const res = await api().get(`${BASE}/auth/me`).set('Authorization', auth(forged));
    expect(res.status).toBe(401);
  });

  it('AUTH-05b: a refresh token cannot be used as an access token → 401', async () => {
    const u = await makeUser();
    const res = await api().get(`${BASE}/auth/me`).set('Authorization', auth(u.refreshToken));
    expect(res.status).toBe(401);
  });

  it('AUTH-06: refresh with garbage refresh_token → 401', async () => {
    const res = await api().post(`${BASE}/auth/refresh`).send({ refresh_token: 'garbage' });
    expect(res.status).toBe(401);
  });

  it('AUTH-07: refresh issues new, working tokens', async () => {
    const u = await makeUser();
    const res = await api().post(`${BASE}/auth/refresh`).send({ refresh_token: u.refreshToken });
    expect(res.status).toBe(200);
    expect(typeof res.body.data.access_token).toBe('string');
    expect(typeof res.body.data.refresh_token).toBe('string');
    // The new access token actually authenticates.
    const me = await api().get(`${BASE}/auth/me`).set('Authorization', auth(res.body.data.access_token));
    expect(me.status).toBe(200);
  });

  it('AUTH-08: name boundaries — empty and 61 chars → 400 field_errors.name', async () => {
    const empty = await api()
      .post(`${BASE}/auth/register`)
      .send({ email: 'n1@test.test', name: '', password: 'Password123!' });
    expect(empty.status).toBe(400);
    expect(empty.body.error.field_errors).toHaveProperty('name');

    const long = await api()
      .post(`${BASE}/auth/register`)
      .send({ email: 'n2@test.test', name: 'x'.repeat(61), password: 'Password123!' });
    expect(long.status).toBe(400);
    expect(long.body.error.field_errors).toHaveProperty('name');
  });

  it('AUTH-09: invalid email format → 400 field_errors.email', async () => {
    const res = await api()
      .post(`${BASE}/auth/register`)
      .send({ email: 'not-an-email', name: 'Ada', password: 'Password123!' });
    expect(res.status).toBe(400);
    expect(res.body.error.field_errors).toHaveProperty('email');
  });

  it('AUTH-10: password boundaries — 8 ok, 7 reject, 200 ok, 201 reject', async () => {
    const seven = await api()
      .post(`${BASE}/auth/register`)
      .send({ email: 'p7@test.test', name: 'Ada', password: '1234567' });
    expect(seven.status).toBe(400);

    const ok8 = await api()
      .post(`${BASE}/auth/register`)
      .send({ email: 'p8@test.test', name: 'Ada', password: '12345678' });
    expect(ok8.status).toBe(201);

    const ok200 = await api()
      .post(`${BASE}/auth/register`)
      .send({ email: 'p200@test.test', name: 'Ada', password: 'a'.repeat(200) });
    expect(ok200.status).toBe(201);

    const over = await api()
      .post(`${BASE}/auth/register`)
      .send({ email: 'p201@test.test', name: 'Ada', password: 'a'.repeat(201) });
    expect(over.status).toBe(400);
  });

  it('AUTH-11: login unknown email → 401 (no enumeration, not 404)', async () => {
    const res = await api()
      .post(`${BASE}/auth/login`)
      .send({ email: 'nobody@test.test', password: 'Password123!' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('unauthorized');
  });

  it('AUTH-12: logout is 204 and stateless — token still valid after (documented limit)', async () => {
    const u = await makeUser();
    const out = await api().post(`${BASE}/auth/logout`).set('Authorization', auth(u.accessToken));
    expect(out.status).toBe(204);
    const me = await api().get(`${BASE}/auth/me`).set('Authorization', auth(u.accessToken));
    expect(me.status).toBe(200); // stateless JWT: logout does not revoke (RISK, §9)
  });
});

// ── 5.2 Settings (/me) ───────────────────────────────────────────────────────
describe('ME — settings edges', () => {
  it('ME-01: set avatarKey then clear with null', async () => {
    const u = await makeUser();
    const set = await api()
      .patch(`${BASE}/me`)
      .set('Authorization', auth(u.accessToken))
      .send({ avatarKey: 'avatars/x.png' });
    expect(set.status).toBe(200);
    expect(set.body.data.avatarKey).toBe('avatars/x.png');

    const clear = await api()
      .patch(`${BASE}/me`)
      .set('Authorization', auth(u.accessToken))
      .send({ avatarKey: null });
    expect(clear.status).toBe(200);
    expect(clear.body.data.avatarKey).toBeNull();
  });

  it('ME-02: quietHours bad time format → 400 field_errors', async () => {
    const u = await makeUser();
    const res = await api()
      .patch(`${BASE}/me`)
      .set('Authorization', auth(u.accessToken))
      .send({ quietHours: { start: '25:00', end: '09:00', tz: 'UTC' } });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('validation_error');
  });

  it('ME-03: quietHours set then clear with null (nullable, not omitted)', async () => {
    const u = await makeUser();
    await api()
      .patch(`${BASE}/me`)
      .set('Authorization', auth(u.accessToken))
      .send({ quietHours: { start: '22:00', end: '07:00', tz: 'Africa/Lagos' } });
    const clear = await api()
      .patch(`${BASE}/me`)
      .set('Authorization', auth(u.accessToken))
      .send({ quietHours: null });
    expect(clear.status).toBe(200);
    expect(clear.body.data.quietHours).toBeNull();
  });

  it('ME-02b: bogus IANA tz is rejected with 400 (BUG-01 fixed)', async () => {
    const u = await makeUser();
    const res = await api()
      .patch(`${BASE}/me`)
      .set('Authorization', auth(u.accessToken))
      .send({ quietHours: { start: '22:00', end: '07:00', tz: 'Not/Real' } });
    // BUG-01 (P2) fix: tz is now validated against Intl at the write path
    // (quietHoursSchema.refine), so a bad zone can never be stored and later
    // swallowed into a silent UTC fallback in lib/push.ts:minutesInTz.
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('validation_error');
    expect(res.body.error.field_errors).toBeDefined();
  });

  it('ME-04: unknown/forbidden fields (email, pairId) are not applied', async () => {
    const u = await makeUser();
    const res = await api()
      .patch(`${BASE}/me`)
      .set('Authorization', auth(u.accessToken))
      .send({ name: 'Renamed', email: 'hijack@test.test', pairId: 'deadbeef' });
    // Either rejected, or accepted-but-stripped. Email must NOT change regardless.
    if (res.status === 200) {
      expect(res.body.data.email).toBe(u.email);
      expect(res.body.data.name).toBe('Renamed');
    } else {
      expect(res.status).toBe(400);
    }
  });

  it('ME-05: PATCH /me without auth → 401', async () => {
    const res = await api().patch(`${BASE}/me`).send({ name: 'x' });
    expect(res.status).toBe(401);
  });

  it('ME-06: DELETE /me with no active pair → 204', async () => {
    const u = await makeUser();
    const res = await api().delete(`${BASE}/me`).set('Authorization', auth(u.accessToken));
    expect(res.status).toBe(204);
  });
});

// ── 6.1 Per-route auth + pair gate ───────────────────────────────────────────
describe('GATE — auth + pair matrix', () => {
  const pairRoutes: Array<[string, 'get' | 'post' | 'put' | 'delete', string]> = [
    ['feed', 'get', `${BASE}/feed`],
    ['create post', 'post', `${BASE}/posts`],
    ['view media', 'get', `${BASE}/posts/6a2d3082075eb8d66abe46b6/media`],
    ['set reaction', 'put', `${BASE}/posts/6a2d3082075eb8d66abe46b6/reaction`],
    ['clear reaction', 'delete', `${BASE}/posts/6a2d3082075eb8d66abe46b6/reaction`],
    ['upload-uri', 'get', `${BASE}/media/upload-uri?ext=jpg`],
  ];

  it('no token on pair-gated routes → 401', async () => {
    for (const [, method, path] of pairRoutes) {
      const res = await api()[method](path);
      expect(res.status, `${method} ${path}`).toBe(401);
    }
  });

  it('authed but unpaired on pair-gated routes → 403 forbidden', async () => {
    const u = await makeUser();
    for (const [name, method, path] of pairRoutes) {
      const res = await api()[method](path).set('Authorization', auth(u.accessToken));
      expect(res.status, name).toBe(403);
      expect(res.body.error.code, name).toBe('forbidden');
    }
  });

  it('push subscribe/unsubscribe require auth → 401 (SA-01)', async () => {
    const sub = await api()
      .post(`${BASE}/push/subscribe`)
      .send({ endpoint: 'https://e.test/x', keys: { p256dh: 'a', auth: 'b' } });
    expect(sub.status).toBe(401);
    const unsub = await api().post(`${BASE}/push/unsubscribe`).send({ endpoint: 'https://e.test/x' });
    expect(unsub.status).toBe(401);
  });

  it('push key is public → 200 with data.key null when VAPID unset', async () => {
    const res = await api().get(`${BASE}/push/key`);
    expect(res.status).toBe(200);
    expect(res.body.data.key).toBeNull();
  });
});

// ── 5.5 Feed/post validation boundaries ──────────────────────────────────────
describe('FEED — validation boundaries', () => {
  it('FEED-05: photo post missing mediaKey → 400', async () => {
    const a = await makeUser('A');
    const b = await makeUser('B');
    await pairUp(a, b);
    const res = await api()
      .post(`${BASE}/posts`)
      .set('Authorization', auth(a.accessToken))
      .send({ type: 'photo' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('validation_error');
  });

  it('FEED-06: voice durationMs boundaries — 0 reject, 1 ok, 30000 ok, 30001 reject', async () => {
    const a = await makeUser('A');
    const b = await makeUser('B');
    await pairUp(a, b);
    const post = (durationMs: number) =>
      api()
        .post(`${BASE}/posts`)
        .set('Authorization', auth(a.accessToken))
        .send({ type: 'voice', mediaKey: 'voice/x.webm', durationMs });
    expect((await post(0)).status).toBe(400);
    expect((await post(1)).status).toBe(201);
    expect((await post(30000)).status).toBe(201);
    expect((await post(30001)).status).toBe(400);
  });

  it('FEED-09: unknown discriminated type → 400', async () => {
    const a = await makeUser('A');
    const b = await makeUser('B');
    await pairUp(a, b);
    const res = await api()
      .post(`${BASE}/posts`)
      .set('Authorization', auth(a.accessToken))
      .send({ type: 'gif', mediaKey: 'x' });
    expect(res.status).toBe(400);
  });

  it('FEED-01: empty feed → posts [] (never null), nextCursor null, hasMore false', async () => {
    const a = await makeUser('A');
    const b = await makeUser('B');
    await pairUp(a, b);
    const res = await api().get(`${BASE}/feed`).set('Authorization', auth(a.accessToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.posts)).toBe(true);
    expect(res.body.data.posts).toHaveLength(0);
    expect(res.body.data.nextCursor).toBeNull();
    expect(res.body.data.hasMore).toBe(false);
  });

  it('FEED-04: bogus non-oid cursor → 400 (not 500)', async () => {
    const a = await makeUser('A');
    const b = await makeUser('B');
    await pairUp(a, b);
    const res = await api()
      .get(`${BASE}/feed?cursor=not-an-oid`)
      .set('Authorization', auth(a.accessToken));
    expect(res.status).toBe(400);
  });

  it('FEED-02: limit boundaries — 0 reject, 51 reject', async () => {
    const a = await makeUser('A');
    const b = await makeUser('B');
    await pairUp(a, b);
    expect((await api().get(`${BASE}/feed?limit=0`).set('Authorization', auth(a.accessToken))).status).toBe(400);
    expect((await api().get(`${BASE}/feed?limit=51`).set('Authorization', auth(a.accessToken))).status).toBe(400);
  });
});

// ── 5.3 Pairing edges ────────────────────────────────────────────────────────
describe('PAIR — extra edges', () => {
  it('PAIR-01: re-invite returns the same live code', async () => {
    const a = await makeUser('A');
    const i1 = await api().post(`${BASE}/pair/invite`).set('Authorization', auth(a.accessToken));
    const i2 = await api().post(`${BASE}/pair/invite`).set('Authorization', auth(a.accessToken));
    expect(i1.body.data.code).toBe(i2.body.data.code);
    expect(i1.body.data.pairId).toBe(i2.body.data.pairId);
  });

  it('PAIR-06: GET /pair when unpaired → 200 data:null', async () => {
    const a = await makeUser('A');
    const res = await api().get(`${BASE}/pair`).set('Authorization', auth(a.accessToken));
    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull();
  });

  it('PAIR-07: leave with no active pair → 404', async () => {
    const a = await makeUser('A');
    const res = await api().post(`${BASE}/pair/leave`).set('Authorization', auth(a.accessToken));
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('not_found');
  });

  it('PAIR-05: claim an already-claimed invite (third user) → 404 (no leak)', async () => {
    const a = await makeUser('A');
    const b = await makeUser('B');
    const c = await makeUser('C');
    const invite = await api().post(`${BASE}/pair/invite`).set('Authorization', auth(a.accessToken));
    const code = invite.body.data.code as string;
    await api().post(`${BASE}/pair/claim`).set('Authorization', auth(b.accessToken)).send({ ref: code });
    const third = await api()
      .post(`${BASE}/pair/claim`)
      .set('Authorization', auth(c.accessToken))
      .send({ ref: code });
    expect(third.status).toBe(404);
    expect(third.body.error.code).toBe('not_found');
  });
});

// ── 5.7 Reactions edges ──────────────────────────────────────────────────────
describe('RX — reaction edges', () => {
  async function pairedPost() {
    const a = await makeUser('A');
    const b = await makeUser('B');
    await pairUp(a, b);
    const post = await api()
      .post(`${BASE}/posts`)
      .set('Authorization', auth(a.accessToken))
      .send({ type: 'text', text: 'hi' });
    return { a, b, postId: post.body.data.id as string };
  }

  it('RX-01: all 6 emojis accepted', async () => {
    const { a, postId } = await pairedPost();
    for (const emoji of ['❤️', '😂', '😭', '🎉', '🔥', '⚡']) {
      const res = await api()
        .put(`${BASE}/posts/${postId}/reaction`)
        .set('Authorization', auth(a.accessToken))
        .send({ emoji });
      expect(res.status, emoji).toBe(200);
      expect(res.body.data.emoji, emoji).toBe(emoji);
    }
  });

  it('RX-04: clear is idempotent (clear with none set → 204 twice)', async () => {
    const { a, postId } = await pairedPost();
    expect((await api().delete(`${BASE}/posts/${postId}/reaction`).set('Authorization', auth(a.accessToken))).status).toBe(204);
    expect((await api().delete(`${BASE}/posts/${postId}/reaction`).set('Authorization', auth(a.accessToken))).status).toBe(204);
  });

  it('RX-06: react to non-existent post → 404', async () => {
    const { a } = await pairedPost();
    const res = await api()
      .put(`${BASE}/posts/6a2d3082075eb8d66abe46b6/reaction`)
      .set('Authorization', auth(a.accessToken))
      .send({ emoji: '❤️' });
    expect(res.status).toBe(404);
  });

  it('RX-07: missing emoji body → 400 field_errors.emoji', async () => {
    const { a, postId } = await pairedPost();
    const res = await api()
      .put(`${BASE}/posts/${postId}/reaction`)
      .set('Authorization', auth(a.accessToken))
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error.field_errors).toHaveProperty('emoji');
  });
});

// ── 5.8 Push edges ───────────────────────────────────────────────────────────
describe('PUSH — edges', () => {
  it('PUSH-03: subscribe upserts by endpoint (no dup)', async () => {
    const u = await makeUser();
    const body = { endpoint: 'https://push.test/abc', keys: { p256dh: 'k1', auth: 'k2' } };
    const r1 = await api().post(`${BASE}/push/subscribe`).set('Authorization', auth(u.accessToken)).send(body);
    const r2 = await api().post(`${BASE}/push/subscribe`).set('Authorization', auth(u.accessToken)).send(body);
    expect(r1.status).toBe(201);
    expect(r2.status).toBe(201);
    expect(r2.body.data.ok).toBe(true);
  });

  it('PUSH-04: subscribe bad body (non-url endpoint) → 400', async () => {
    const u = await makeUser();
    const res = await api()
      .post(`${BASE}/push/subscribe`)
      .set('Authorization', auth(u.accessToken))
      .send({ endpoint: 'not-a-url', keys: { p256dh: 'a', auth: 'b' } });
    expect(res.status).toBe(400);
  });

  it('PUSH-05: unsubscribe unknown endpoint → 200 (idempotent)', async () => {
    const u = await makeUser();
    const res = await api()
      .post(`${BASE}/push/unsubscribe`)
      .set('Authorization', auth(u.accessToken))
      .send({ endpoint: 'https://push.test/never' });
    expect(res.status).toBe(200);
    expect(res.body.data.ok).toBe(true);
  });
});

// ── 6.3 Cross-cutting invariants ─────────────────────────────────────────────
describe('X — cross-cutting invariants', () => {
  it('X-03: no secret fields ever appear in responses', async () => {
    const u = await makeUser();
    const me = await api().get(`${BASE}/auth/me`).set('Authorization', auth(u.accessToken));
    const blob = JSON.stringify(me.body);
    for (const secret of ['passwordHash', 'password', 'tokenVersion', '__v']) {
      expect(blob.includes(secret), secret).toBe(false);
    }
  });

  it('X-03b: pair member shape carries no email', async () => {
    const a = await makeUser('A');
    const b = await makeUser('B');
    await pairUp(a, b);
    const pair = await api().get(`${BASE}/pair`).set('Authorization', auth(a.accessToken));
    const blob = JSON.stringify(pair.body.data.members);
    expect(blob.includes('@test.test')).toBe(false);
  });

  it('X-02: ids are 24-char hex ObjectIds', async () => {
    const u = await makeUser();
    expect(u.id).toMatch(/^[a-f0-9]{24}$/i);
  });

  it('X-05: error envelope shape on a 4xx', async () => {
    const res = await api().get(`${BASE}/auth/me`);
    expect(res.body).toHaveProperty('error.code');
    expect(res.body).toHaveProperty('error.message');
    expect(res.body).not.toHaveProperty('data');
  });

  it('X-06: success envelope shape on a 2xx', async () => {
    const res = await api().get(`${BASE}/health`);
    expect(res.body).toHaveProperty('data');
    expect(res.body).not.toHaveProperty('error');
  });

  it('X-09: unknown route → 404 envelope, not raw HTML', async () => {
    const res = await api().get(`${BASE}/does-not-exist`);
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('X-01: dates are ISO 8601 strings', async () => {
    const a = await makeUser('A');
    const invite = await api().post(`${BASE}/pair/invite`).set('Authorization', auth(a.accessToken));
    expect(invite.body.data.expiresAt).toMatch(/^\d{4}-\d{2}-\d{2}T.*Z$/);
  });
});
