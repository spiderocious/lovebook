import { Link } from 'react-router-dom';

import { ROUTES } from '@lovebook/core';
import { AppText } from '@lovebook/ui';
import { IconBack } from '@icons';

import { ProfileSection } from './parts/profile-section.tsx';
import { QuietHoursSection } from './parts/quiet-hours-section.tsx';
import { NotificationsSection } from './parts/notifications-section.tsx';
import { PairSection } from './parts/pair-section.tsx';
import { DangerSection } from './parts/danger-section.tsx';

export function SettingsScreen() {
  return (
    <main className="mx-auto min-h-dvh max-w-md px-5 py-6">
      <div className="mb-6 flex items-center gap-3">
        <Link to={ROUTES.FEED} aria-label="Back to feed" className="text-ink-3 hover:text-ink">
          <IconBack size={22} />
        </Link>
        <AppText variant="heading" as="h1">
          Settings
        </AppText>
      </div>

      <div className="flex flex-col gap-10">
        <ProfileSection />
        <QuietHoursSection />
        <NotificationsSection />
        <PairSection />
        <DangerSection />
      </div>
    </main>
  );
}
