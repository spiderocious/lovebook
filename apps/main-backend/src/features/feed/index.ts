import type { Express } from 'express';

import { feedRouter, mediaRouter, postsRouter } from './feed.routes.js';

// The feed feature owns three mounts: the read feed, posts (create + media +
// reactions live under a post), and the media upload-uri proxy.
export const register = (app: Express): void => {
  app.use('/api/v1/feed', feedRouter);
  app.use('/api/v1/posts', postsRouter);
  app.use('/api/v1/media', mediaRouter);
};
