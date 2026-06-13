import { Link } from 'react-router-dom';

import { ROUTES } from '@lovebook/core';
import { AppText, StatusPill } from '@lovebook/ui';
import { IconSettings } from '@icons';

import { useOnline } from '@shared/hooks/use-online.ts';

export function FeedTopBar() {
  const online = useOnline();
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-hair bg-paper/90 px-5 py-3 backdrop-blur">
      <div className="flex items-center gap-2">
        <AppText variant="overline" className="text-ink-2">
          lovebook
        </AppText>
        <StatusPill tone={online ? 'ok' : 'wait'} dotOnly aria-label={online ? 'Online' : 'Offline'} />
      </div>
      <Link to={ROUTES.SETTINGS} aria-label="Settings" className="text-ink-3 hover:text-ink">
        <IconSettings size={20} />
      </Link>
    </header>
  );
}
