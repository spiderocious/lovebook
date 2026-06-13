import { fileURLToPath } from 'node:url';
import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Custom service worker: we extend Workbox precaching with push handling
      // and an offline outbox replay (injectManifest gives us the SW source).
      strategies: 'injectManifest',
      srcDir: 'src/pwa',
      filename: 'sw.ts',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,woff,woff2,svg,png,ico}'],
      },
      manifest: {
        name: 'lovebook',
        short_name: 'lovebook',
        description: 'One feed, two people. Post a moment, your person sees it.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#f8f4ee',
        theme_color: '#6e455e',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: [
      { find: '@app', replacement: path.resolve(__dirname, 'src') },
      { find: '@features', replacement: path.resolve(__dirname, 'src/features') },
      { find: '@shared', replacement: path.resolve(__dirname, 'src/shared') },
      // Specific alias first so '@lovebook/ui/styles.css' wins before the bare '@lovebook/ui' rule.
      {
        find: '@lovebook/ui/styles.css',
        replacement: path.resolve(__dirname, '../../packages/ui/src/styles.css'),
      },
      { find: /^@lovebook\/ui$/, replacement: path.resolve(__dirname, '../../packages/ui/src/index.ts') },
      {
        find: /^@lovebook\/core$/,
        replacement: path.resolve(__dirname, '../../packages/core/src/index.ts'),
      },
      {
        find: /^@lovebook\/api$/,
        replacement: path.resolve(__dirname, '../../packages/api/src/index.ts'),
      },
      {
        find: /^@icons$/,
        replacement: path.resolve(__dirname, '../../packages/ui/src/icons/index.ts'),
      },
    ],
  },
  server: {
    port: 5173,
    strictPort: false,
  },
});
