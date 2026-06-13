// Shared domain DTOs — the exact shapes the backend serializes and the frontend
// consumes. Nullable fields use `| null` (not optional `?`) so the seam stays
// honest under `exactOptionalPropertyTypes`. IDs are strings (Mongo ObjectId
// hex); dates are ISO 8601 strings.

import type { PairStatus, PostType } from '../domain/constants.js';

export type { PairStatus, PostType, ReactionEmoji } from '../domain/constants.js';

export interface QuietHours {
  start: string; // "HH:mm"
  end: string; // "HH:mm"
  tz: string; // IANA tz id
}

/** The authenticated user's own profile. */
export interface User {
  id: string;
  email: string;
  name: string;
  avatarKey: string | null;
  pairId: string | null;
  quietHours: QuietHours | null;
}

/** A member of a pair as seen by the other member (no email/private fields). */
export interface PairMember {
  id: string;
  name: string;
  avatarKey: string | null;
}

export interface Pair {
  id: string;
  status: PairStatus;
  members: PairMember[];
  createdAt: string;
  archivedAt: string | null;
}

export interface Reaction {
  emoji: string;
  reactorId: string;
  createdAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  type: PostType;
  text: string | null;
  mediaKey: string | null; // present for photo/voice; resolve via the media endpoint
  durationMs: number | null; // present for voice
  reactions: Reaction[]; // one per member (max 2 in a pair); [] if none yet
  createdAt: string;
}

/** Tokens issued on register/login/refresh. */
export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface AuthResult {
  user: User;
  tokens: AuthTokens;
}

/** Initiator-side invite, returned when minting. */
export interface Invite {
  code: string;
  pairId: string;
  expiresAt: string;
}

/** Receiver-side preview of who's inviting them. */
export interface InvitePreview {
  initiator: PairMember;
  expiresAt: string;
}

/** Cursor-paginated feed page. */
export interface FeedPage {
  posts: Post[];
  nextCursor: string | null;
  hasMore: boolean;
}

/** A signed, short-lived URL for viewing a post's media. */
export interface MediaUri {
  uri: string;
  expiresIn: string;
}

/** A presigned upload target plus the permanent key to persist. */
export interface UploadTarget {
  key: string;
  uri: string;
  expiresIn: string;
}
