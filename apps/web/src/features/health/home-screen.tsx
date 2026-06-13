import { Link } from 'react-router-dom';

import { ROUTES } from '@lovebook/core';
import { AppButton, AppText } from '@lovebook/ui';

export function HomeScreen() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-6 py-16">
      <AppText variant="overline" className="text-ink-3">
        lovebook
      </AppText>
      <AppText variant="display" as="h1" className="mt-3 text-ink">
        One feed, two people.
      </AppText>
      <AppText variant="voice" className="mt-4 max-w-lg text-ink-2">
        Post a moment, your person sees it. No replies, no metrics, just presence —
        a quiet shared space between the two of you.
      </AppText>

      <div className="mt-9 flex flex-wrap gap-3">
        <Link to={ROUTES.REGISTER}>
          <AppButton size="lg">Get started</AppButton>
        </Link>
        <Link to={ROUTES.LOGIN}>
          <AppButton variant="quiet" size="lg" type="button">
            I have an account
          </AppButton>
        </Link>
      </div>
    </main>
  );
}
