import { useNavigate, Link } from 'react-router-dom';

import { ROUTES } from '@lovebook/core';
import { AppText, DrawerService, HoldToConfirmButton } from '@lovebook/ui';

import { useAuth } from '@features/auth/providers/auth-provider.tsx';
import { usePair, useLeavePair } from '@features/pair/api/use-pair.ts';

export function PairSection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: pair } = usePair();
  const leave = useLeavePair();

  const partner = pair?.members.find((m) => m.id !== user?.id);

  const onLeave = () => {
    leave.mutate(undefined, {
      onSuccess: () => {
        DrawerService.toast('Pair archived', { tone: 'ok' });
        navigate(ROUTES.PAIR, { replace: true });
      },
    });
  };

  return (
    <section className="flex flex-col gap-3">
      <AppText variant="overline" className="text-ink-3">
        Your pair
      </AppText>
      <AppText variant="body-sm" className="text-ink-3">
        You’re paired with {partner?.name ?? 'your person'}. If you leave, the shared
        feed is archived — you’ll both be able to pair with someone new, and they’ll
        be notified.
      </AppText>
      <HoldToConfirmButton onConfirm={onLeave} confirmingLabel="Hold to leave…">
        Leave pair
      </HoldToConfirmButton>
      <Link to={ROUTES.PAST_PAIRS} className="text-[13px] text-plum underline">
        Past pairs
      </Link>
    </section>
  );
}
