// Single source of truth for backend URL paths. Apps reach the server through
// the named constants here so a rename touches one line, not dozens.
export const EP = {
  HEALTH: 'api/v1/health',

  AUTH_LOGIN: 'api/v1/auth/login',
  AUTH_REGISTER: 'api/v1/auth/register',
  AUTH_REFRESH: 'api/v1/auth/refresh',
  AUTH_LOGOUT: 'api/v1/auth/logout',
  AUTH_ME: 'api/v1/me',

  // Example feature — placeholder CRUD wiring. Replace with real endpoints.
  EXAMPLE_LIST: 'api/v1/example',
  EXAMPLE_ITEM: (id: string) => `api/v1/example/${id}`,
} as const;
