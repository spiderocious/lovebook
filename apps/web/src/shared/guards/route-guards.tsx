import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { ROUTES } from '@lovebook/core';
import { Skeleton } from '@lovebook/ui';

import { useAuth } from '@features/auth/providers/auth-provider.tsx';

function FullScreenLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center p-8" role="status" aria-live="polite">
      <Skeleton kind="postcard" />
    </div>
  );
}

/** Gate authed routes. While the session resolves, show a loader; then redirect or render. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  if (status === 'loading') return <FullScreenLoading />;
  if (status === 'unauthenticated') return <Navigate to={ROUTES.LOGIN} replace />;
  // Authenticated. Route by pairing state is handled by RequirePair/RequireNoPair below.
  void user;
  return <>{children}</>;
}

/** Keep authenticated users out of login/register/landing — send them into the app. */
export function RequireGuest({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  if (status === 'loading') return <FullScreenLoading />;
  if (status === 'authenticated') {
    return <Navigate to={user?.pairId ? ROUTES.FEED : ROUTES.PAIR} replace />;
  }
  return <>{children}</>;
}

/** The feed + settings require an active pair; unpaired users go to the pairing screen. */
export function RequirePair({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  if (status === 'loading') return <FullScreenLoading />;
  if (status === 'unauthenticated') return <Navigate to={ROUTES.LOGIN} replace />;
  if (!user?.pairId) return <Navigate to={ROUTES.PAIR} replace />;
  return <>{children}</>;
}

/** The pairing screen is only for the unpaired; paired users go to the feed. */
export function RequireNoPair({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  if (status === 'loading') return <FullScreenLoading />;
  if (status === 'unauthenticated') return <Navigate to={ROUTES.LOGIN} replace />;
  if (user?.pairId) return <Navigate to={ROUTES.FEED} replace />;
  return <>{children}</>;
}
