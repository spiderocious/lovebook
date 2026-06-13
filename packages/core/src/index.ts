// Routing
export { ROUTES } from './constants/routes.js';

// Auth / token storage
export { createTokenStorage, TOKEN_KEYS } from './auth/token-storage.js';
export type { TokenStorage } from './auth/token-storage.js';

// Domain types (DTOs)
export * from './types/index.js';

// Domain constants
export {
  TEXT_MAX_LENGTH,
  VOICE_MAX_DURATION_MS,
  INVITE_CODE_LENGTH,
  INVITE_CODE_ALPHABET,
  INVITE_TTL_MS,
  DEFAULT_REACTION,
  REACTIONS,
  PUSH_BATCH_WINDOW_MS,
  POST_TYPES,
  PAIR_STATUSES,
} from './domain/constants.js';

// Domain schemas (Zod — single source for request validation + inferred types)
export {
  emailSchema,
  passwordSchema,
  displayNameSchema,
  timeOfDaySchema,
  quietHoursSchema,
  registerBodySchema,
  loginBodySchema,
  refreshBodySchema,
  updateMeBodySchema,
  pairRefSchema,
  claimBodySchema,
  createPostBodySchema,
  reactionEmojiSchema,
  setReactionBodySchema,
  pushSubscribeBodySchema,
  pushUnsubscribeBodySchema,
} from './domain/schemas.js';
export type {
  RegisterBody,
  LoginBody,
  RefreshBody,
  UpdateMeBody,
  ClaimBody,
  CreatePostBody,
  SetReactionBody,
  PushSubscribeBody,
  PushUnsubscribeBody,
} from './domain/schemas.js';

// Helpers
export { formatRelative } from './time/format-relative.js';
export { idempotencyKey } from './ids/idempotency-key.js';
