import { useNavigate } from 'react-router-dom';

import { ROUTES } from '@lovebook/core';
import { AppButton, AppText, InviteCodeEntry } from '@lovebook/ui';

export function EnterCodeFlow({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate();

  return (
    <div className="mt-3 flex flex-col gap-6">
      <div>
        <AppText variant="display" as="h1" className="text-ink">
          Enter the code.
        </AppText>
        <AppText variant="voice" className="mt-3 text-ink-2">
          Type the six-character code your person sent you.
        </AppText>
      </div>

      <InviteCodeEntry
        autoFocus
        onComplete={(code) => navigate(ROUTES.PAIR_INVITE(code))}
      />

      <AppButton variant="quiet" onClick={onBack}>
        Back
      </AppButton>
    </div>
  );
}
