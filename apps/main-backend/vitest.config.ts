import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { defineConfig } from 'vitest/config';

const here = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@features': path.resolve(here, 'src/features'),
      '@lib': path.resolve(here, 'src/lib'),
      '@middlewares': path.resolve(here, 'src/middlewares'),
      '@shared': path.resolve(here, 'src/shared'),
      '@lovebook/core': path.resolve(here, '../../packages/core/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    // Mongoose models are process-global; run files serially to share one
    // in-memory mongod and avoid model-registration clashes.
    fileParallelism: false,
    hookTimeout: 60_000,
    testTimeout: 30_000,
  },
});
