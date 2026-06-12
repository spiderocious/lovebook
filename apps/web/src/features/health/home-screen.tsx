import { Link } from 'react-router-dom';

import { useHealth } from '@lovebook/api';
import { ROUTES } from '@lovebook/core';
import { AppButton, AppText } from '@lovebook/ui';

export function HomeScreen() {
  const { data, isLoading, isError } = useHealth();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <AppText variant="caption">web app</AppText>
      <AppText variant="display-1" className="mt-2 text-brand-900">
        Monorepo template
      </AppText>
      <AppText variant="body" className="mt-4 max-w-2xl text-ink-700">
        A starting point: Nx + pnpm workspace with shared <code>core</code>,{' '}
        <code>api</code> and <code>ui</code> packages, an Express backend and three
        frontends. Replace this copy and build your product.
      </AppText>

      <div className="mt-8 flex gap-3">
        <Link to={ROUTES.EXAMPLE}>
          <AppButton>Open example</AppButton>
        </Link>
        <AppButton variant="secondary" type="button">
          Sign in
        </AppButton>
      </div>

      <section className="mt-12 rounded-lg border border-brand-900/10 bg-white/60 p-4 text-sm">
        <AppText variant="caption">backend health</AppText>
        <div className="mt-2">
          {isLoading && 'Checking…'}
          {isError && <span className="text-accent-600">unreachable — is main-backend running?</span>}
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
