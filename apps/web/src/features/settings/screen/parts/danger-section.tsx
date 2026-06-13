import { useNavigate } from 'react-router-dom';

import { ROUTES } from '@lovebook/core';
import { AppButton, AppText, DrawerService } from '@lovebook/ui';

import { useAuth } from '@features/auth/providers/auth-provider.tsx';

import { useDeleteAccount } from '../../api/use-settings.ts';

export function DangerSection() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const deleteAccount = useDeleteAccount();

  const onSignOut = () => {
    logout();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  const onDelete = () => {
    // Type-to-confirm — irreversible (PRD §10): your posts/reactions are removed;
    // your partner keeps their copy of the shared history.
    DrawerService.critical('Delete your account?', {
      description:
        'This removes your posts and reactions for good. Your person keeps their copy of your history together.',
      confirmPrompt: 'Type DELETE to confirm',
      confirmPhrase: 'DELETE',
      confirmLabel: 'Delete forever',
      onConfirm: () =>
        deleteAccount.mutate(undefined, {
          onSuccess: () => navigate(ROUTES.HOME, { replace: true }),
          onError: () => DrawerService.toast('Couldn’t delete the account', { tone: 'crit' }),
        }),
    });
  };

  return (
    <section className="flex flex-col gap-3 border-t border-hair pt-6">
      <AppButton variant="quiet" onClick={onSignOut}>
        Sign out
      </AppButton>
      <AppText variant="overline" className="mt-2 text-ink-3">
        Danger zone
      </AppText>
      <AppButton variant="danger" onClick={onDelete}>
        Delete account
      </AppButton>
    </section>
  );
}
