// Single source of truth for backend URL paths. Apps reach the server through
// the named constants here so a rename touches one line, not dozens.
export const EP = {
  HEALTH: 'api/v1/health',

  // Auth
  AUTH_REGISTER: 'api/v1/auth/register',
  AUTH_LOGIN: 'api/v1/auth/login',
  AUTH_REFRESH: 'api/v1/auth/refresh',
  AUTH_LOGOUT: 'api/v1/auth/logout',
  AUTH_ME: 'api/v1/auth/me',

  // Settings (self)
  ME: 'api/v1/me',

  // Pairing
  PAIR: 'api/v1/pair',
  PAIR_INVITE: 'api/v1/pair/invite',
  PAIR_LOOKUP: (ref: string) => `api/v1/pair/lookup/${ref}`,
  PAIR_CLAIM: 'api/v1/pair/claim',
  PAIR_LEAVE: 'api/v1/pair/leave',
  PAIR_ARCHIVES: 'api/v1/pair/archives',

  // Feed + posts
  FEED: 'api/v1/feed',
  POSTS: 'api/v1/posts',
  POST_MEDIA: (id: string) => `api/v1/posts/${id}/media`,
  POST_REACTION: (id: string) => `api/v1/posts/${id}/reaction`,

  // Media
  MEDIA_UPLOAD_URI: 'api/v1/media/upload-uri',

  // Push
  PUSH_KEY: 'api/v1/push/key',
  PUSH_SUBSCRIBE: 'api/v1/push/subscribe',
  PUSH_UNSUBSCRIBE: 'api/v1/push/unsubscribe',
} as const;
