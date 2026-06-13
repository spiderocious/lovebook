import type { Express } from 'express';

import pushRoutes from './push.routes.js';

export const register = (app: Express): void => {
  app.use('/api/v1/push', pushRoutes);
};
