import type { Pair, PairMember, Post, Reaction, User } from '@lovebook/core';
import type { Types } from 'mongoose';

import type { PairDoc } from '../models/pair.model.js';
import type { PostDoc } from '../models/post.model.js';
import type { ReactionDoc } from '../models/reaction.model.js';
import type { UserDoc } from '../models/user.model.js';

// Doc → DTO translators. The ONLY place Mongo documents become wire shapes, so
// the seam (the @lovebook/core types) has a single enforcement point. ObjectId
// → hex string, Date → ISO 8601, undefined → null.

const id = (v: Types.ObjectId): string => v.toString();
const iso = (d: Date): string => d.toISOString();

export function toUser(doc: UserDoc): User {
  return {
    id: id(doc._id),
    email: doc.email,
    name: doc.name,
    avatarKey: doc.avatarKey ?? null,
    pairId: doc.pairId ? id(doc.pairId as unknown as Types.ObjectId) : null,
    quietHours: doc.quietHours
      ? { start: doc.quietHours.start, end: doc.quietHours.end, tz: doc.quietHours.tz }
      : null,
  };
}

export function toPairMember(doc: UserDoc): PairMember {
  return { id: id(doc._id), name: doc.name, avatarKey: doc.avatarKey ?? null };
}

export function toPair(doc: PairDoc, members: UserDoc[]): Pair {
  return {
    id: id(doc._id),
    status: doc.status,
    members: members.map(toPairMember),
    createdAt: iso(doc.createdAt),
    archivedAt: doc.archivedAt ? iso(doc.archivedAt) : null,
  };
}

export function toReaction(doc: ReactionDoc): Reaction {
  return {
    emoji: doc.emoji,
    reactorId: id(doc.reactorId as unknown as Types.ObjectId),
    createdAt: iso(doc.createdAt),
  };
}

export function toPost(doc: PostDoc, reaction: ReactionDoc | null): Post {
  return {
    id: id(doc._id),
    authorId: id(doc.authorId as unknown as Types.ObjectId),
    type: doc.type,
    text: doc.text ?? null,
    mediaKey: doc.mediaKey ?? null,
    durationMs: doc.durationMs ?? null,
    reaction: reaction ? toReaction(reaction) : null,
    createdAt: iso(doc.createdAt),
  };
}
