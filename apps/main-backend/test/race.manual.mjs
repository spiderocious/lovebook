// Replica-set race test (SM-RACE) — the atomic pair-lock under REAL concurrency.
// The in-memory test mongod is standalone, so the transaction path (the one that
// actually runs in prod) is never exercised by the vitest suite. This script
// connects to a single-node replica set and fires concurrent claims to prove the
// "at most one non-archived pair per user" invariant holds.
//
// Run: mongod --replSet rs0 --port 27018 ... ; then
//   node --import tsx test/race.manual.mjs
import mongoose from 'mongoose';
import supertest from 'supertest';

process.env.NODE_ENV = 'test';
process.env.APP_BASE_URL = 'http://localhost:9092';
process.env.WEB_BASE_URL = 'http://localhost:5173';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_at_least_32_chars_long_xx';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_at_least_32_chars_long_x';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '30d';
process.env.FILE_SERVICE_BASE_URL = 'http://file-service.test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27018/lovebook-race?replicaSet=rs0';

const { buildApp } = await import('../src/app.ts');
const { supportsTransactions } = await import('../src/lib/db.ts');

await mongoose.connect(process.env.MONGODB_URI);
const app = buildApp();
const api = () => supertest(app);
const BASE = '/api/v1';

let pass = 0;
let fail = 0;
const ok = (cond, msg) => { (cond ? pass++ : fail++); console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${msg}`); };

let n = 0;
async function makeUser() {
  n += 1;
  const res = await api().post(`${BASE}/auth/register`).send({
    email: `race${n}_${Date.now()}@test.test`, name: `U${n}`, password: 'Password123!',
  });
  return { id: res.body.data.user.id, token: res.body.data.tokens.access_token };
}
const bearer = (t) => `Bearer ${t}`;

async function cleanup() {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
}

console.log(`\nsupportsTransactions() => ${supportsTransactions()} (must be true for this to mean anything)\n`);

// SM-RACE-01: two users claim the SAME invite simultaneously.
{
  console.log('SM-RACE-01: two users claim the same invite concurrently');
  await cleanup();
  const a = await makeUser();
  const b = await makeUser();
  const c = await makeUser();
  const invite = await api().post(`${BASE}/pair/invite`).set('Authorization', bearer(a.token));
  const code = invite.body.data.code;
  const pairId = invite.body.data.pairId;

  const [r1, r2] = await Promise.all([
    api().post(`${BASE}/pair/claim`).set('Authorization', bearer(b.token)).send({ ref: code }),
    api().post(`${BASE}/pair/claim`).set('Authorization', bearer(c.token)).send({ ref: code }),
  ]);
  const statuses = [r1.status, r2.status].sort();
  const winners = [r1, r2].filter((r) => r.status === 200).length;
  ok(winners === 1, `exactly one winner (got statuses ${JSON.stringify(statuses)})`);

  const pair = await mongoose.connection.collection('pairs').findOne({ _id: new mongoose.Types.ObjectId(pairId) });
  ok(pair?.status === 'active', `pair is active (got ${pair?.status})`);
  ok(pair?.memberIds?.length === 2, `pair has exactly 2 members (got ${pair?.memberIds?.length})`);

  // The loser must remain unpaired.
  const loserToken = r1.status === 200 ? c.token : b.token;
  const me = await api().get(`${BASE}/pair`).set('Authorization', bearer(loserToken));
  ok(me.body.data === null, 'losing claimer is left unpaired');
}

// SM-RACE-03: one user fires two concurrent invites — at most one live invite.
{
  console.log('\nSM-RACE-03: one user, two concurrent invites');
  await cleanup();
  const a = await makeUser();
  const [i1, i2] = await Promise.all([
    api().post(`${BASE}/pair/invite`).set('Authorization', bearer(a.token)),
    api().post(`${BASE}/pair/invite`).set('Authorization', bearer(a.token)),
  ]);
  ok(i1.status === 201 && i2.status === 201, `both invite calls succeed (${i1.status}, ${i2.status})`);
  const liveInvites = await mongoose.connection.collection('invites').countDocuments({ createdBy: new mongoose.Types.ObjectId(a.id) });
  const pendingPairs = await mongoose.connection.collection('pairs').countDocuments({ createdBy: new mongoose.Types.ObjectId(a.id), status: 'pending' });
  ok(liveInvites <= 1, `at most one live invite for the user (got ${liveInvites})`);
  ok(pendingPairs <= 1, `at most one pending pair for the user (got ${pendingPairs})`);
}

console.log(`\n=== RACE RESULT: ${pass} PASS / ${fail} FAIL ===\n`);
await mongoose.disconnect();
process.exit(fail > 0 ? 1 : 0);
