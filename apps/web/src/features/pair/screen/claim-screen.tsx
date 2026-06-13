import { useEffect } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import { ROUTES } from '@lovebook/core';
import { AppButton, AppText, PairMark } from '@lovebook/ui';
import { Loadable, Show } from 'meemaw';

import { useAuth } from '@features/auth/providers/auth-provider.tsx';
import { topLevelError } from '@shared/api/form-errors.ts';

import { useClaimPair, useInviteLookup } from '../api/use-pair.ts';

// The receiver side of pairing (PRD §4). Reached by the shared link /pair/:ref or
// by typing a code. A guest is sent to register first (carrying the ref); a
// paired user is sent to their feed; an unpaired user previews + claims.
export function ClaimScreen() {
  const { ref = '' } = useParams();
  const navigate = useNavigate();
  const { status, user } = useAuth();

  const authed = status === 'authenticated';
  const lookup = useInviteLookup(ref, authed && !user?.pairId);
  const claim = useClaimPair();

  useEffect(() => {
    if (claim.isSuccess) navigate(ROUTES.FEED, { replace: true });
  }, [claim.isSuccess, navigate]);

  if (status === 'loading') return null;
  if (!authed) {
    // Send to sign-up, carrying the ref so we return here after.
    return <Navigate to={`${ROUTES.REGISTER}?pair=${encodeURIComponent(ref)}`} replace />;
  }
  if (user?.pairId) return <Navigate to={ROUTES.FEED} replace />;

  const initiator = lookup.data?.initiator;
  const claimErr = topLevelError(claim.error);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-12">
      <AppText variant="overline" className="text-ink-3">
        lovebook
      </AppText>

      <Loadable
        loading={lookup.isLoading}
        error={lookup.isError}
        errorComponent={
          <div className="mt-4">
            <AppText variant="display" as="h1" className="text-ink">
              This invite isn’t available.
            </AppText>
            <AppText variant="voice" className="mt-3 text-ink-2">
              It may have expired, already been claimed, or the code was mistyped.
            </AppText>
            <AppButton variant="quiet" className="mt-6" onClick={() => navigate(ROUTES.PAIR)}>
              Back to pairing
            </AppButton>
          </div>
        }
      >
        <Show when={Boolean(initiator)}>
          <div className="mt-4 flex flex-col items-start gap-5">
            <PairMark
              you={(user?.name ?? '?').charAt(0).toUpperCase()}
              them={(initiator?.name ?? '?').charAt(0).toUpperCase()}
              size="xl"
            />
            <div>
              <AppText variant="display" as="h1" className="text-ink">
                {initiator?.name} wants to pair with you.
              </AppText>
              <AppText variant="voice" className="mt-3 text-ink-2">
                This will create a lovebook just between the two of you.
              </AppText>
            </div>

            <Show when={Boolean(claimErr)}>
              <AppText variant="body" className="text-crit">
                {claimErr}
              </AppText>
            </Show>

            <div className="flex w-full flex-col gap-3">
              <AppButton size="lg" loading={claim.isPending} onClick={() => claim.mutate(ref)}>
                Pair with {initiator?.name}
              </AppButton>
              <AppButton variant="quiet" onClick={() => navigate(ROUTES.PAIR)}>
                Not now
              </AppButton>
            </div>
          </div>
        </Show>
      </Loadable>
    </main>
  );
}
