import { Link } from 'react-router-dom';

import { useHealth } from '@lovebook/api';
import { ROUTES } from '@lovebook/core';
import { AppButton, AppText } from '@lovebook/ui';

export function HomeScreen() {
  const { data, isLoading, isError } = useHealth();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <AppText variant="overline">lovebook</AppText>
      <AppText variant="display" className="mt-2 text-ink">
        One feed, two people.
      </AppText>
      <AppText variant="body" className="mt-4 max-w-2xl">
        Post a moment, your person sees it. No replies, no metrics, just presence. The{' '}
        <code>@lovebook/ui</code> component library lives behind the design-system preview.
      </AppText>

      <div className="mt-8 flex gap-3">
        <Link to={ROUTES.PREVIEW}>
          <AppButton>Open the design system</AppButton>
        </Link>
      </div>

      <section className="mt-12 rounded-card border border-print-edge bg-print p-4 text-sm">
        <AppText variant="overline">backend health</AppText>
        <div className="mt-2">
          {isLoading && 'Checking…'}
          {isError && <span className="text-wait">unreachable — is main-backend running?</span>}
          {data && (
            <span>
              status: <strong>{data.status}</strong>
            </span>
          )}
        </div>
      </section>
    </main>
  );
}
