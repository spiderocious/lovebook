// Centralised route table. Apps import from here so route strings have
// exactly one source of truth across web + admin surfaces.
export const ROUTES = {
  // Public
  HOME: '/',
  ABOUT: '/about',

  // Auth
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',

  // Pairing
  PAIR: '/pair',
  PAIR_INVITE: (ref: string) => `/pair/${ref}`,

  // App
  FEED: '/feed',
  SETTINGS: '/settings',
  PAST_PAIRS: '/settings/past-pairs',

  // Design-system preview (the @lovebook/ui viewer)
  PREVIEW: '/preview',

  // Admin
  ADMIN_LOGIN: '/admin/login',
  ADMIN_HOME: '/admin',
  ADMIN_USERS: '/admin/users',
} as const;
