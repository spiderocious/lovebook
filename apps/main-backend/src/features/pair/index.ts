import type { Express } from 'express';

import pairRoutes from './pair.routes.js';

export const register = (app: Express): void => {
  app.use('/api/v1/pair', pairRoutes);
};
