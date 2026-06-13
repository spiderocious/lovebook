/// <reference lib="webworker" />
// lovebook service worker (Workbox injectManifest source).
//
// Responsibilities:
//  - precache the app shell + static assets (the __WB_MANIFEST placeholder)
//  - serve the feed NetworkFirst so recent posts are visible offline
//  - cache media (storage origin) CacheFirst, capped, so images/audio survive offline
//  - receive Web Push and show the notification ("<name> dropped a moment")
//  - focus/open the feed on notificationclick
//
// The compose outbox (queued posts while offline) is driven from the app via
// `src/pwa/outbox.ts` + a replay on `online`; it is intentionally not a
// background-sync queue here to keep media-blob handling in the page context.

import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

precacheAndRoute(self.__WB_MANIFEST);

// Feed API: fresh when online, cached fallback when offline.
registerRoute(
  ({ url }) => url.pathname.endsWith('/api/v1/feed'),
  new NetworkFirst({ cacheName: 'lovebook-feed', networkTimeoutSeconds: 4 }),
);

// Media bytes (the storageapi.dev origin the signed URLs point to).
registerRoute(
  ({ url }) => url.hostname.includes('storageapi.dev'),
  new CacheFirst({
    cacheName: 'lovebook-media',
    plugins: [new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 })],
  }),
);

self.addEventListener('push', (event: PushEvent) => {
  const data = (() => {
    try {
      return event.data?.json() as { title?: string } | undefined;
    } catch {
      return undefined;
    }
  })();
  const title = data?.title ?? 'lovebook';
  event.waitUntil(
    self.registration.showNotification(title, {
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: 'lovebook-moment',
    }),
  );
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => 'focus' in c);
      if (existing) return (existing as WindowClient).focus();
      return self.clients.openWindow('/feed');
    }),
  );
});
