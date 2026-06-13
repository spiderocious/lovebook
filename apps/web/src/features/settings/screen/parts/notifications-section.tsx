import { AppButton, AppText, DrawerService } from '@lovebook/ui';
import { Show } from 'meemaw';

import { topLevelError } from '@shared/api/form-errors.ts';

import { pushSupported, useEnablePush, usePushKey } from '../../api/use-push.ts';

export function NotificationsSection() {
  const enable = useEnablePush();
  const keyQuery = usePushKey();

  const supported = pushSupported();
  const configured = Boolean(keyQuery.data?.key);

  const onEnable = () => {
    enable.mutate(undefined, {
      onSuccess: () => DrawerService.toast('Notifications on', { tone: 'ok' }),
    });
  };

  return (
    <section className="flex flex-col gap-3">
      <AppText variant="overline" className="text-ink-3">
        Notifications
      </AppText>
      <AppText variant="body-sm" className="text-ink-3">
        Get a quiet ping when {`{your person}`} drops a moment — no preview, just a nudge.
      </AppText>

      <Show when={!supported}>
        <AppText variant="body-sm" className="text-ink-3">
          This device doesn’t support push. On iPhone, add lovebook to your home screen first.
        </AppText>
      </Show>

      <Show when={supported}>
        <div>
          <AppButton
            variant="secondary"
            size="sm"
            loading={enable.isPending}
            disabled={!configured}
            onClick={onEnable}
          >
            {enable.isSuccess ? 'Notifications enabled' : 'Enable notifications'}
          </AppButton>
          <Show when={!configured}>
            <AppText variant="body-sm" className="mt-1 text-ink-3">
              Push isn’t configured on the server yet.
            </AppText>
          </Show>
          <Show when={enable.isError}>
            <AppText variant="body-sm" className="mt-1 text-crit">
              {topLevelError(enable.error) ?? 'Couldn’t enable notifications.'}
            </AppText>
          </Show>
        </div>
      </Show>
    </section>
  );
}
