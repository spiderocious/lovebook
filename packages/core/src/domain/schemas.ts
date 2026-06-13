// The one schema source. Zod schemas here feed both the frontend (inferred
// request types) and the backend (boundary parsing). DTO shapes (server →
// client) are expressed as TypeScript interfaces in ./types so the seam is
// explicit and `exactOptionalPropertyTypes` stays honest (nullable, not optional).
import { z } from 'zod';

import {
  INVITE_CODE_LENGTH,
  REACTIONS,
  TEXT_MAX_LENGTH,
  VOICE_MAX_DURATION_MS,
} from './constants.js';

// ── Shared primitives ────────────────────────────────────────────────────────

export const emailSchema = z.string().trim().toLowerCase().email();
export const passwordSchema = z.string().min(8).max(200);
export const displayNameSchema = z.string().trim().min(1).max(60);

/** "HH:mm" 24h. */
export const timeOfDaySchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected HH:mm');

/** A valid IANA timezone id — probed via Intl so a bad zone can't be stored. */
const isValidTimeZone = (tz: string): boolean => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

export const quietHoursSchema = z.object({
  start: timeOfDaySchema,
  end: timeOfDaySchema,
  // IANA tz id, validated against Intl so push windows are never computed in the
  // wrong zone (a bad zone would otherwise be silently swallowed → UTC fallback).
  tz: z.string().min(1).refine(isValidTimeZone, { message: 'Invalid IANA timezone' }),
});

// ── Auth ─────────────────────────────────────────────────────────────────────

export const registerBodySchema = z.object({
  email: emailSchema,
  name: displayNameSchema,
  password: passwordSchema,
});
export type RegisterBody = z.infer<typeof registerBodySchema>;

export const loginBodySchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
export type LoginBody = z.infer<typeof loginBodySchema>;

export const refreshBodySchema = z.object({
  refresh_token: z.string().min(1),
});
export type RefreshBody = z.infer<typeof refreshBodySchema>;

// ── Settings ───────────────────────────────────────────────────────────────

export const updateMeBodySchema = z
  .object({
    name: displayNameSchema.optional(),
    avatarKey: z.string().min(1).nullable().optional(),
    quietHours: quietHoursSchema.nullable().optional(),
  })
  .refine((b) => Object.keys(b).length > 0, { message: 'No fields to update' });
export type UpdateMeBody = z.infer<typeof updateMeBodySchema>;

// ── Pairing ──────────────────────────────────────────────────────────────────

/** A ref is either a 6-char invite code or a 24-char Mongo ObjectId (the link). */
export const pairRefSchema = z
  .string()
  .trim()
  .min(INVITE_CODE_LENGTH)
  .max(24);

export const claimBodySchema = z.object({ ref: pairRefSchema });
export type ClaimBody = z.infer<typeof claimBodySchema>;

// ── Posts ────────────────────────────────────────────────────────────────────

const textPostSchema = z.object({
  type: z.literal('text'),
  text: z.string().trim().min(1).max(TEXT_MAX_LENGTH),
});

const photoPostSchema = z.object({
  type: z.literal('photo'),
  mediaKey: z.string().min(1),
});

const voicePostSchema = z.object({
  type: z.literal('voice'),
  mediaKey: z.string().min(1),
  durationMs: z.number().int().positive().max(VOICE_MAX_DURATION_MS),
});

export const createPostBodySchema = z.discriminatedUnion('type', [
  textPostSchema,
  photoPostSchema,
  voicePostSchema,
]);
export type CreatePostBody = z.infer<typeof createPostBodySchema>;

// ── Reactions ────────────────────────────────────────────────────────────────

export const reactionEmojiSchema = z.enum(REACTIONS);
export const setReactionBodySchema = z.object({ emoji: reactionEmojiSchema });
export type SetReactionBody = z.infer<typeof setReactionBodySchema>;

// ── Push ─────────────────────────────────────────────────────────────────────

export const pushSubscribeBodySchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});
export type PushSubscribeBody = z.infer<typeof pushSubscribeBodySchema>;

export const pushUnsubscribeBodySchema = z.object({
  endpoint: z.string().url(),
});
export type PushUnsubscribeBody = z.infer<typeof pushUnsubscribeBodySchema>;
