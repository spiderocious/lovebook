import { useState } from 'react';

import { AppButton, AppText, ChromeField, DrawerService } from '@lovebook/ui';
import { Show } from 'meemaw';

import { useAuth } from '@features/auth/providers/auth-provider.tsx';
import { fieldError } from '@shared/api/form-errors.ts';

import { useUpdateMe } from '../../api/use-settings.ts';

export function ProfileSection() {
  const { user } = useAuth();
  const update = useUpdateMe();
  const [name, setName] = useState(user?.name ?? '');

  const dirty = name.trim() !== (user?.name ?? '') && name.trim().length > 0;

  const save = () => {
    update.mutate(
      { name: name.trim() },
      { onSuccess: () => DrawerService.toast('Name updated', { tone: 'ok' }) },
    );
  };

  return (
    <section className="flex flex-col gap-3">
      <AppText variant="overline" className="text-ink-3">
        Profile
      </AppText>
      <ChromeField
        label="Display name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        aria-invalid={Boolean(fieldError(update.error, 'name'))}
      />
      <Show when={dirty}>
        <div className="flex justify-end">
          <AppButton size="sm" loading={update.isPending} onClick={save}>
            Save
          </AppButton>
        </div>
      </Show>
    </section>
  );
}
