import { useState } from 'react';

import { AppButton, AppText, DrawerService, SettingRow, Switch, TimeField } from '@lovebook/ui';
import { Show } from 'meemaw';

import { useAuth } from '@features/auth/providers/auth-provider.tsx';

import { useUpdateMe } from '../../api/use-settings.ts';

// Quiet hours (PRD §8): a per-user window during which push is muted. Stored on
// the user with the browser's resolved IANA timezone.
export function QuietHoursSection() {
  const { user } = useAuth();
  const update = useUpdateMe();

  const existing = user?.quietHours ?? null;
  const [enabled, setEnabled] = useState(Boolean(existing));
  const [start, setStart] = useState(existing?.start ?? '22:00');
  const [end, setEnd] = useState(existing?.end ?? '07:00');

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const save = () => {
    const quietHours = enabled ? { start, end, tz } : null;
    update.mutate(
      { quietHours },
      { onSuccess: () => DrawerService.toast('Quiet hours updated', { tone: 'ok' }) },
    );
  };

  return (
    <section className="flex flex-col gap-3">
      <AppText variant="overline" className="text-ink-3">
        Quiet hours
      </AppText>
      <SettingRow
        title="Mute notifications overnight"
        description="No pings during your window."
        control={<Switch checked={enabled} onCheckedChange={setEnabled} aria-label="Quiet hours" />}
      />
      <Show when={enabled}>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2">
            <AppText variant="label" className="text-ink-3">
              From
            </AppText>
            <TimeField value={start} onChange={(e) => setStart(e.target.value)} aria-label="Start" />
          </label>
          <label className="flex items-center gap-2">
            <AppText variant="label" className="text-ink-3">
              to
            </AppText>
            <TimeField value={end} onChange={(e) => setEnd(e.target.value)} aria-label="End" />
          </label>
        </div>
      </Show>
      <div className="flex justify-end">
        <AppButton size="sm" loading={update.isPending} onClick={save}>
          Save
        </AppButton>
      </div>
    </section>
  );
}
