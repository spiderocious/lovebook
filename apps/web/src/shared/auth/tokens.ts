import { createTokenStorage, TOKEN_KEYS, type AuthTokens } from '@lovebook/core';

// The same storage the @lovebook/api ky client reads from for the Authorization
// header + 401 refresh. The app writes tokens here on login/register; the client
// picks them up automatically.
const storage = createTokenStorage();

export const tokens = {
  set(t: AuthTokens): void {
    storage.set(TOKEN_KEYS.ACCESS, t.access_token);
    storage.set(TOKEN_KEYS.REFRESH, t.refresh_token);
  },
  clear(): void {
    storage.remove(TOKEN_KEYS.ACCESS);
    storage.remove(TOKEN_KEYS.REFRESH);
  },
  hasSession(): boolean {
    return storage.get(TOKEN_KEYS.ACCESS) !== null;
  },
};
