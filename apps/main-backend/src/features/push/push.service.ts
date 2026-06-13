import { Ok, type ServiceResult } from '@lib/result.js';
import { isWithinQuietHours, sendPush } from '@lib/push.js';
import { env } from '../../env.js';
import { UserModel } from '../../models/user.model.js';

import { pushRepo } from './push.repo.js';

// Subscription management + the notify-on-post fan-out. Quiet-hours and 30s
// batching (PRD §6) are applied here. Sending is best-effort and never blocks
// the post-create response.

export const pushService = {
  async subscribe(input: {
    userId: string;
    endpoint: string;
    keys: { p256dh: string; auth: string };
  }): Promise<ServiceResult<{ ok: true }>> {
    await pushRepo.upsert(input);
    return Ok({ ok: true });
  },

  async unsubscribe(endpoint: string): Promise<ServiceResult<{ ok: true }>> {
    await pushRepo.removeByEndpoint(endpoint);
    return Ok({ ok: true });
  },

  vapidKey(): string | null {
    return env.VAPID_PUBLIC_KEY ?? null;
  },

  /**
   * Notify a recipient that their partner dropped a moment. No content preview.
   * Respects quiet hours (skips send when muted — a full deferred-delivery queue
   * is a later pass; for now the muted notification is simply not sent).
   * Batching across a 30s window is handled by the SW `tag` collapsing identical
   * notifications plus the caller debouncing rapid posts.
   */
  async notifyMoment(recipientId: string, authorName: string): Promise<void> {
    const recipient = await UserModel.findById(recipientId).select('quietHours').lean();
    if (!recipient) return;
    const quiet = recipient.quietHours
      ? {
          start: recipient.quietHours.start,
          end: recipient.quietHours.end,
          tz: recipient.quietHours.tz,
        }
      : null;
    if (isWithinQuietHours(quiet, new Date())) return;

    const subs = await pushRepo.findForUser(recipientId);
    const title = `${authorName} dropped a moment`;
    await Promise.all(
      subs.map(async (sub) => {
        if (!sub.keys?.p256dh || !sub.keys.auth) return;
        const ok = await sendPush(
          { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } },
          { title },
        );
        if (!ok) await pushRepo.removeByEndpoint(sub.endpoint);
      }),
    );
  },
};
