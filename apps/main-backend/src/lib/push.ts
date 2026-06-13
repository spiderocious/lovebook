import webpush from 'web-push';

import type { QuietHours } from '@lovebook/core';

import { env, isPushConfigured } from '../env.js';
import { logger } from './logger.js';

let configured = false;

function ensureConfigured(): boolean {
  if (configured) return true;
  if (!isPushConfigured()) return false;
  webpush.setVapidDetails(env.VAPID_SUBJECT!, env.VAPID_PUBLIC_KEY!, env.VAPID_PRIVATE_KEY!);
  configured = true;
  return true;
}

export interface PushTarget {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

/**
 * Send a notification to one subscription. Returns false (never throws) if push
 * isn't configured or the subscription is gone (410/404 — caller should prune).
 */
export async function sendPush(target: PushTarget, payload: { title: string }): Promise<boolean> {
  if (!ensureConfigured()) return false;
  try {
    await webpush.sendNotification(
      { endpoint: target.endpoint, keys: target.keys },
      JSON.stringify(payload),
    );
    return true;
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) return false; // expired subscription
    logger.warn({ err, status }, 'push send failed');
    return false;
  }
}

/**
 * True if `now` falls within the user's quiet-hours window. Handles windows that
 * wrap past midnight (e.g. 22:00 → 07:00). When in quiet hours, the caller defers
 * delivery to the unmute time rather than dropping (PRD §6).
 */
export function isWithinQuietHours(quietHours: QuietHours | null, now: Date): boolean {
  if (!quietHours) return false;
  const minutes = minutesInTz(now, quietHours.tz);
  const start = toMinutes(quietHours.start);
  const end = toMinutes(quietHours.end);
  if (start === end) return false;
  return start < end ? minutes >= start && minutes < end : minutes >= start || minutes < end;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function minutesInTz(date: Date, tz: string): number {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: tz,
    }).formatToParts(date);
    const h = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
    const m = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
    return (h % 24) * 60 + m;
  } catch {
    return date.getUTCHours() * 60 + date.getUTCMinutes();
  }
}
