import { createContext, useContext, useMemo, type ReactNode } from 'react';

import type { User } from '@lovebook/core';

import { tokens } from '@shared/auth/tokens.ts';

import { useLogout, useMe } from '../api/use-auth.ts';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const hasSession = tokens.hasSession();
  const { data: user, isLoading, isError } = useMe(hasSession);
  const logoutMutation = useLogout();

  const value = useMemo<AuthContextValue>(() => {
    let status: AuthStatus;
    if (!hasSession) status = 'unauthenticated';
    else if (isLoading) status = 'loading';
    else if (isError || !user) status = 'unauthenticated';
    else status = 'authenticated';

    return {
      status,
      user: user ?? null,
      logout: () => logoutMutation.mutate(),
    };
  }, [hasSession, isLoading, isError, user, logoutMutation]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
