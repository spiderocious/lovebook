// Simple synchronous token storage abstraction. Defaults to localStorage in
// the browser, no-op on the server (so SSR pages won't crash). Apps can
// inject their own implementation (e.g. cookie-based) by passing one to
// configureApiClient.

export const TOKEN_KEYS = {
  ACCESS: 'app.access_token',
  REFRESH: 'app.refresh_token',
} as const;

export type TokenKey = (typeof TOKEN_KEYS)[keyof typeof TOKEN_KEYS];

export interface TokenStorage {
  get(key: TokenKey): string | null;
  set(key: TokenKey, value: string): void;
  remove(key: TokenKey): void;
}

const noopStorage: TokenStorage = {
  get: () => null,
  set: () => undefined,
  remove: () => undefined,
};

// Reach localStorage via globalThis so this file type-checks without the DOM lib
// (it's consumed by the Node backend's barrel import too). Runtime behaviour is
// unchanged: browser → localStorage, server → no-op.
interface WebStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const getLocalStorage = (): WebStorageLike | null => {
  const ls = (globalThis as { localStorage?: WebStorageLike }).localStorage;
  return ls ?? null;
};

export const createTokenStorage = (): TokenStorage => {
  const ls = getLocalStorage();
  if (!ls) return noopStorage;
  return {
    get: (key) => ls.getItem(key),
    set: (key, value) => ls.setItem(key, value),
    remove: (key) => ls.removeItem(key),
  };
};
