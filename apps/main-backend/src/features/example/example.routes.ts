import { Router, type IRouter } from 'express';

import { asyncHandler } from '@lib/http/asyncHandler.js';
import { ResponseUtil } from '@lib/response.js';

// Example feature — placeholder CRUD wiring so the frontend has a real target
// and you can see the request → envelope → response path end to end. Swap the
// in-memory store for your data layer and delete this comment.

interface ExampleItem {
  id: string;
  title: string;
  createdAt: string;
}

const items: ExampleItem[] = [
  { id: 'item_1', title: 'First example item', createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'item_2', title: 'Second example item', createdAt: '2026-01-02T00:00:00.000Z' },
];

const router: IRouter = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    return ResponseUtil.ok(res, { items });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const item = items.find((i) => i.id === req.params.id);
    if (!item) {
      return ResponseUtil.error(res, 404, {
        code: 'not_found',
        message: 'Example item not found',
      });
    }
    return ResponseUtil.ok(res, item);
  }),
);

export default router;
