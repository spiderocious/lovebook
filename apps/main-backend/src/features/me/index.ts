import type { Express } from 'express';

import meRoutes from './me.routes.js';

export const register = (app: Express): void => {
  app.use('/api/v1/me', meRoutes);
};
