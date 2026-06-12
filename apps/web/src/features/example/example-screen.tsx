import { Link } from 'react-router-dom';

import { ROUTES } from '@lovebook/core';
import { AppText } from '@lovebook/ui';

// Placeholder feature screen. Demonstrates the routing + shared-package wiring.
// Replace with a real feature, or delete and remove the route in app.routes.tsx.
export function ExampleScreen() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <AppText variant="overline">example feature</AppText>
      <AppText variant="heading" className="mt-2 text-ink">
        This is a placeholder screen
      </AppText>
      <AppText variant="body" className="mt-4">
        Swap this out for your first real feature. It exists only to show the
        route table, shared UI primitives and the cross-package imports working
        together.
      </AppText>

      <p className="mt-8 text-sm">
        <Link to={ROUTES.HOME} className="text-plum underline">
          ← back home
        </Link>
      </p>
    </main>
  );
}
