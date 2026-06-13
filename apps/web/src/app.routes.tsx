import { lazy, Suspense, type ReactNode } from 'react';
import { Route, Routes } from 'react-router-dom';

import { ROUTES } from '@lovebook/core';
import { Skeleton } from '@lovebook/ui';

import {
  RequireAuth,
  RequireGuest,
  RequireNoPair,
  RequirePair,
} from '@shared/guards/route-guards.tsx';

// Route-level code splitting (frontend guide §6): every screen is lazy.
const HomeScreen = lazy(() =>
  import('@features/health/home-screen.tsx').then((m) => ({ default: m.HomeScreen })),
);
const LoginScreen = lazy(() =>
  import('@features/auth/screen/login-screen.tsx').then((m) => ({ default: m.LoginScreen })),
);
const RegisterScreen = lazy(() =>
  import('@features/auth/screen/register-screen.tsx').then((m) => ({ default: m.RegisterScreen })),
);
const PairScreen = lazy(() =>
  import('@features/pair/screen/pair-screen.tsx').then((m) => ({ default: m.PairScreen })),
);
const ClaimScreen = lazy(() =>
  import('@features/pair/screen/claim-screen.tsx').then((m) => ({ default: m.ClaimScreen })),
);
const FeedScreen = lazy(() =>
  import('@features/feed/screen/feed-screen.tsx').then((m) => ({ default: m.FeedScreen })),
);
const SettingsScreen = lazy(() =>
  import('@features/settings/screen/settings-screen.tsx').then((m) => ({
    default: m.SettingsScreen,
  })),
);
const PastPairsScreen = lazy(() =>
  import('@features/settings/screen/past-pairs-screen.tsx').then((m) => ({
    default: m.PastPairsScreen,
  })),
);
const PreviewScreen = lazy(() =>
  import('@features/preview/preview-screen.tsx').then((m) => ({ default: m.PreviewScreen })),
);

function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center p-8" role="status" aria-live="polite">
      <Skeleton kind="postcard" />
    </div>
  );
}

function Lazy({ children }: { children: ReactNode }) {
  return <Suspense fallback={<Loading />}>{children}</Suspense>;
}

export function AppRoutes() {
  return (
    <Lazy>
      <Routes>
        {/* Public landing — redirects authed users into the app. */}
        <Route
          path={ROUTES.HOME}
          element={
            <RequireGuest>
              <HomeScreen />
            </RequireGuest>
          }
        />

        {/* Auth (guests only) */}
        <Route
          path={ROUTES.LOGIN}
          element={
            <RequireGuest>
              <LoginScreen />
            </RequireGuest>
          }
        />
        <Route
          path={ROUTES.REGISTER}
          element={
            <RequireGuest>
              <RegisterScreen />
            </RequireGuest>
          }
        />

        {/* Pairing — authed + unpaired */}
        <Route
          path={ROUTES.PAIR}
          element={
            <RequireNoPair>
              <PairScreen />
            </RequireNoPair>
          }
        />
        {/* Claim/confirm — authed; handles guest→register and already-paired internally */}
        <Route
          path={ROUTES.PAIR_INVITE(':ref')}
          element={
            <RequireAuth>
              <ClaimScreen />
            </RequireAuth>
          }
        />

        {/* The app — authed + paired */}
        <Route
          path={ROUTES.FEED}
          element={
            <RequirePair>
              <FeedScreen />
            </RequirePair>
          }
        />
        <Route
          path={ROUTES.SETTINGS}
          element={
            <RequirePair>
              <SettingsScreen />
            </RequirePair>
          }
        />
        <Route
          path={ROUTES.PAST_PAIRS}
          element={
            <RequireAuth>
              <PastPairsScreen />
            </RequireAuth>
          }
        />

        {/* Design-system preview (dev tool) */}
        <Route path={ROUTES.PREVIEW} element={<PreviewScreen />} />

        <Route path="*" element={<HomeScreen />} />
      </Routes>
    </Lazy>
  );
}
