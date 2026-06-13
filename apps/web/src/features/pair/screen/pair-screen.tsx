import { useState } from 'react';

import { AppButton, AppText } from '@lovebook/ui';
import { Show } from 'meemaw';

import { useCreateInvite } from '../api/use-pair.ts';
import { InviteFlow } from './parts/invite-flow.tsx';
import { EnterCodeFlow } from './parts/enter-code-flow.tsx';

type Mode = 'choose' | 'invite' | 'enter';

// The unpaired empty-state hub (PRD §4). Two paths: invite someone (primary) or
// enter a code (secondary). Each path is its own part.
//
// The invite is minted from the button click (a user event) rather than from an
// effect on mount — effect-fired mutations double-run under React StrictMode and
// can strand the mutation state on a discarded observer (the "stuck loader" bug).
export function PairScreen() {
  const [mode, setMode] = useState<Mode>('choose');
  const createInvite = useCreateInvite();

  const startInvite = () => {
    setMode('invite');
    if (!createInvite.data && !createInvite.isPending) createInvite.mutate();
  };

  const back = () => {
    setMode('choose');
    createInvite.reset();
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-12">
      <AppText variant="overline" className="text-ink-3">
        lovebook
      </AppText>

      <Show when={mode === 'choose'}>
        <AppText variant="display" as="h1" className="mt-3 text-ink">
          Pair with someone.
        </AppText>
        <AppText variant="voice" className="mt-3 text-ink-2">
          lovebook is just for the two of you. Invite your person, or enter the code
          they sent you.
        </AppText>
        <div className="mt-8 flex flex-col gap-3">
          <AppButton size="lg" onClick={startInvite}>
            Invite someone
          </AppButton>
          <AppButton variant="quiet" size="lg" onClick={() => setMode('enter')}>
            Enter an invite code
          </AppButton>
        </div>
      </Show>

      <Show when={mode === 'invite'}>
        <InviteFlow
          invite={createInvite.data}
          isPending={createInvite.isPending}
          isError={createInvite.isError}
          onBack={back}
        />
      </Show>

      <Show when={mode === 'enter'}>
        <EnterCodeFlow onBack={() => setMode('choose')} />
      </Show>
    </main>
  );
}
