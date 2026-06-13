import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { ROUTES, type Invite } from '@lovebook/core';
import { AppButton, AppText, InviteCodeDisplay, StatusPill } from '@lovebook/ui';
import { Loadable, Show } from 'meemaw';

import { usePair } from '../../api/use-pair.ts';

const WEB_ORIGIN = typeof window !== 'undefined' ? window.location.origin : '';

// Presentational: the parent (PairScreen) owns the create-invite mutation and
// fires it on the button click — never from a mount effect (that double-ran under
// StrictMode and stranded the result on a discarded observer, leaving isPending
// stuck true). Here we just show the code + link and poll for the pair to lock.
export function InviteFlow({
  invite,
  isPending,
  isError,
  onBack,
}: {
  invite: Invite | undefined;
  isPending: boolean;
  isError: boolean;
  onBack: () => void;
}) {
  const navigate = useNavigate();

  // Poll for the pair becoming active (the other person claimed). Only while an
  // invite exists, so this never runs unbounded.
  const { data: pair } = usePair({ refetchInterval: invite ? 3000 : false });
  useEffect(() => {
    if (pair?.status === 'active') navigate(ROUTES.FEED, { replace: true });
  }, [pair, navigate]);

  const shareLink = invite ? `${WEB_ORIGIN}${ROUTES.PAIR_INVITE(invite.pairId)}` : '';

  return (
    <div className="mt-3 flex flex-col gap-6">
      <div>
        <AppText variant="display" as="h1" className="text-ink">
          Send the invite.
        </AppText>
        <AppText variant="voice" className="mt-3 text-ink-2">
          Share this code or link with your person. It works once, and expires in 24 hours.
        </AppText>
      </div>

      <Loadable
        loading={isPending}
        error={isError}
        errorComponent={
          <AppText variant="body" className="text-crit">
            Couldn’t create an invite. Go back and try again.
          </AppText>
        }
      >
        <Show when={Boolean(invite)}>
          <InviteCodeDisplay
            code={invite?.code ?? ''}
            copyText={shareLink}
            expiryLabel="Expires in 24 hours"
          />
          <div className="flex items-center gap-2">
            <StatusPill tone="wait" />
            <AppText variant="body-sm" className="text-ink-3">
              Waiting for {invite?.code} to be claimed…
            </AppText>
          </div>
        </Show>
      </Loadable>

      <AppButton variant="quiet" onClick={onBack}>
        Back
      </AppButton>
    </div>
  );
}
