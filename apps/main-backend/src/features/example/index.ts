import type { Express } from 'express';

import exampleRoutes from './example.routes.js';

export const register = (app: Express): void => {
  app.use('/api/v1/example', exampleRoutes);
};
