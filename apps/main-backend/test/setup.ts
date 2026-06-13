import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll } from 'vitest';

// Env MUST be set before any module imports src/env.ts (it parses at import
// time). Vitest runs setupFiles before the test modules, so this is the spot.
process.env.NODE_ENV = 'test';
process.env.APP_BASE_URL = 'http://localhost:9092';
process.env.WEB_BASE_URL = 'http://localhost:5173';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_at_least_32_chars_long_xx';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_at_least_32_chars_long_x';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '30d';
process.env.FILE_SERVICE_BASE_URL = 'http://file-service.test';
// env.ts parses MONGODB_URI at import time (before beforeAll runs), so seed a
// synchronous placeholder. The real in-memory URI is connected in beforeAll;
// buildApp() never reads MONGODB_URI itself — only connectDb() does, which the
// tests bypass in favour of their own mongoose.connect.
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/lovebook-test-placeholder';

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  await mongoose.connect(process.env.MONGODB_URI);
});

afterEach(async () => {
  // Truncate, don't drop+recreate — faster and keeps indexes.
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});
