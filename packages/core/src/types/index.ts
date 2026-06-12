// Shared domain types live here. These are placeholders for a fresh project —
// replace them with your own entities. Kept minimal so nothing carries over
// from the template.

export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

// Example entity used by the `example` feature wiring (web + backend).
// Delete once you have real domain types.
export interface ExampleItem {
  id: string;
  title: string;
  createdAt: string; // ISO 8601
}
