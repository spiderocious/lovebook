import { describe, expect, it } from 'vitest';

import { api, auth, makeUser, pairUp } from './helpers.js';

async function post(token: string, body: unknown) {
  return api().post('/api/v1/posts').set('Authorization', auth(token)).send(body);
}

describe('feed + posts', () => {
  it('requires a pair (403) before posting or reading the feed', async () => {
    const lonely = await makeUser('Lonely');
    const feed = await api().get('/api/v1/feed').set('Authorization', auth(lonely.accessToken));
    expect(feed.status).toBe(403);
    expect(feed.body.error.code).toBe('forbidden');

    const p = await post(lonely.accessToken, { type: 'text', text: 'hi' });
    expect(p.status).toBe(403);
  });

  it('creates a text post and both members see it at the top of the feed', async () => {
    const a = await makeUser('Ada');
    const b = await makeUser('Ben');
    await pairUp(a, b);

    const created = await post(a.accessToken, { type: 'text', text: 'Sky was unreasonable.' });
    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({
      type: 'text',
      text: 'Sky was unreasonable.',
      mediaKey: null,
      durationMs: null,
      reactions: [],
    });

    const feedB = await api().get('/api/v1/feed').set('Authorization', auth(b.accessToken));
    expect(feedB.status).toBe(200);
    expect(feedB.body.data.posts[0].text).toBe('Sky was unreasonable.');
    expect(feedB.body.data.hasMore).toBe(false);
    expect(feedB.body.data.nextCursor).toBeNull();
  });

  it('rejects text over 200 chars and voice over 30s (validation_error)', async () => {
    const a = await makeUser('Ada');
    const b = await makeUser('Ben');
    await pairUp(a, b);

    const long = await post(a.accessToken, { type: 'text', text: 'x'.repeat(201) });
    expect(long.status).toBe(400);
    expect(long.body.error.code).toBe('validation_error');

    const loud = await post(a.accessToken, {
      type: 'voice',
      mediaKey: 'k.webm',
      durationMs: 30001,
    });
    expect(loud.status).toBe(400);
  });

  it('paginates with a cursor (newest first, never offset)', async () => {
    const a = await makeUser('Ada');
    const b = await makeUser('Ben');
    await pairUp(a, b);
    for (let i = 0; i < 3; i += 1) await post(a.accessToken, { type: 'text', text: `m${i}` });

    const page1 = await api()
      .get('/api/v1/feed?limit=2')
      .set('Authorization', auth(a.accessToken));
    expect(page1.body.data.posts).toHaveLength(2);
    expect(page1.body.data.posts[0].text).toBe('m2'); // newest first
    expect(page1.body.data.hasMore).toBe(true);

    const page2 = await api()
      .get(`/api/v1/feed?limit=2&cursor=${page1.body.data.nextCursor}`)
      .set('Authorization', auth(a.accessToken));
    expect(page2.body.data.posts).toHaveLength(1);
    expect(page2.body.data.posts[0].text).toBe('m0');
    expect(page2.body.data.hasMore).toBe(false);
  });

  it('isolates pairs — a third user in another pair cannot read the feed', async () => {
    const a = await makeUser('Ada');
    const b = await makeUser('Ben');
    await pairUp(a, b);
    await post(a.accessToken, { type: 'text', text: 'private' });

    const c = await makeUser('Cy');
    const d = await makeUser('Dee');
    await pairUp(c, d);

    const feedC = await api().get('/api/v1/feed').set('Authorization', auth(c.accessToken));
    expect(feedC.body.data.posts).toHaveLength(0);
  });

  it('blocks cross-pair media access with 403 (the access gate holds)', async () => {
    const a = await makeUser('Ada');
    const b = await makeUser('Ben');
    await pairUp(a, b);
    const created = await post(a.accessToken, { type: 'photo', mediaKey: 'lovef-x.jpg' });
    const postId = created.body.data.id;

    const c = await makeUser('Cy');
    const d = await makeUser('Dee');
    await pairUp(c, d);

    const stolen = await api()
      .get(`/api/v1/posts/${postId}/media`)
      .set('Authorization', auth(c.accessToken));
    expect(stolen.status).toBe(403);
  });
});

describe('reactions', () => {
  it('sets, replaces (never duplicates), and clears a reaction', async () => {
    const a = await makeUser('Ada');
    const b = await makeUser('Ben');
    await pairUp(a, b);
    const created = await post(a.accessToken, { type: 'text', text: 'react to me' });
    const postId = created.body.data.id;

    const set1 = await api()
      .put(`/api/v1/posts/${postId}/reaction`)
      .set('Authorization', auth(b.accessToken))
      .send({ emoji: '❤️' });
    expect(set1.status).toBe(200);
    expect(set1.body.data.emoji).toBe('❤️');

    // Re-tap replaces, does not duplicate.
    const set2 = await api()
      .put(`/api/v1/posts/${postId}/reaction`)
      .set('Authorization', auth(b.accessToken))
      .send({ emoji: '🔥' });
    expect(set2.status).toBe(200);

    const feed = await api().get('/api/v1/feed').set('Authorization', auth(a.accessToken));
    // Re-tap replaced, did not duplicate: exactly one reaction, now 🔥.
    expect(feed.body.data.posts[0].reactions).toHaveLength(1);
    expect(feed.body.data.posts[0].reactions[0].emoji).toBe('🔥');

    const clear = await api()
      .delete(`/api/v1/posts/${postId}/reaction`)
      .set('Authorization', auth(b.accessToken));
    expect(clear.status).toBe(204);

    const feed2 = await api().get('/api/v1/feed').set('Authorization', auth(a.accessToken));
    expect(feed2.body.data.posts[0].reactions).toEqual([]);
  });

  it('rejects an emoji outside the allowed set', async () => {
    const a = await makeUser('Ada');
    const b = await makeUser('Ben');
    await pairUp(a, b);
    const created = await post(a.accessToken, { type: 'text', text: 'x' });
    const res = await api()
      .put(`/api/v1/posts/${created.body.data.id}/reaction`)
      .set('Authorization', auth(b.accessToken))
      .send({ emoji: '🦄' });
    expect(res.status).toBe(400);
  });
});
