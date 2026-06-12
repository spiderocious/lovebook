// Centralised route table. Apps import from here so route strings have
// exactly one source of truth across web + admin + website surfaces.
export const ROUTES = {
  // Public marketing
  HOME: '/',
  PRICING: '/pricing',
  ABOUT: '/about',

  // Auth
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',

  // App
  DASHBOARD: '/dashboard',
  EXAMPLE: '/example',
  EXAMPLE_ITEM: (id: string) => `/example/${id}`,

  // Design-system preview (the @lovebook/ui viewer)
  PREVIEW: '/preview',

  // Admin
  ADMIN_LOGIN: '/admin/login',
  ADMIN_HOME: '/admin',
  ADMIN_USERS: '/admin/users',
} as const;
