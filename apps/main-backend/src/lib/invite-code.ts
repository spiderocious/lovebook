import { randomInt } from 'node:crypto';

import { INVITE_CODE_ALPHABET, INVITE_CODE_LENGTH } from '@lovebook/core';

// 6 chars over a 32-symbol alphabet ≈ 1.07e9 permutations — fine for a
// one-time, 24h-expiring handshake (PRD §12). Uniqueness among *live* codes is
// enforced by the DB; the repo retries on the rare collision.
export function generateInviteCode(): string {
  let out = '';
  for (let i = 0; i < INVITE_CODE_LENGTH; i += 1) {
    out += INVITE_CODE_ALPHABET[randomInt(INVITE_CODE_ALPHABET.length)];
  }
  return out;
}
