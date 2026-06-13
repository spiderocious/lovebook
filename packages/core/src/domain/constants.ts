// Product constraints, shared by frontend + backend. The product's personality
// is what it doesn't have — these limits are deliberate.

/** One-line text post: max characters. */
export const TEXT_MAX_LENGTH = 200;

/** Voice note: max duration in milliseconds. */
export const VOICE_MAX_DURATION_MS = 30_000;

/** Invite code: length and alphabet (uppercase, no ambiguous chars). */
export const INVITE_CODE_LENGTH = 6;
export const INVITE_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Invite lifetime. */
export const INVITE_TTL_MS = 24 * 60 * 60 * 1000;

/** The single default reaction (tap), plus the long-press alternatives. */
export const DEFAULT_REACTION = '❤️';
export const REACTIONS = ['❤️', '😂', '😭', '🎉', '🔥', '⚡'] as const;
export type ReactionEmoji = (typeof REACTIONS)[number];

/** Notifications posted by the same author within this window batch into one. */
export const PUSH_BATCH_WINDOW_MS = 30_000;

export const POST_TYPES = ['photo', 'voice', 'text'] as const;
export type PostType = (typeof POST_TYPES)[number];

export const PAIR_STATUSES = ['pending', 'active', 'archived'] as const;
export type PairStatus = (typeof PAIR_STATUSES)[number];
