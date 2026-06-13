import { useCallback, useState } from 'react';

import { RequestError } from '@shared/api/unwrap.ts';

import { useCompose, type ComposeInput } from '../../api/use-compose.ts';

// Shared send-state for the three composers. The sheet stays open until the send
// SUCCEEDS — on failure we keep it open, surface the error, and flip the CTA to
// "Try again" so the user can re-submit without re-composing. The loading state
// lives on the button (the caller passes `sending`), never as a full-screen swap.
export function useComposeSend(onSuccess: () => void) {
  const { compose } = useCompose();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const send = useCallback(
    async (input: ComposeInput) => {
      setSending(true);
      setError(null);
      try {
        await compose(input);
        onSuccess();
      } catch (err) {
        setError(err);
      } finally {
        setSending(false);
      }
    },
    [compose, onSuccess],
  );

  return { send, sending, error };
}

/** Human message for a compose failure, branching on the backend code when present. */
export function errorText(error: unknown): string {
  if (error instanceof RequestError) {
    if (error.code === 'network') return 'Couldn’t send — check your connection and try again.';
    return error.message;
  }
  if (error) return 'Couldn’t send. Try again.';
  return '';
}
