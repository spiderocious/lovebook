import type { ReactNode } from 'react';

import { AppText } from '@lovebook/ui';

// Centred, calm auth canvas — paper background, the wordmark, a serif heading,
// then the form. Shared by login + register.
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-12">
      <AppText variant="overline" className="text-ink-3">
        lovebook
      </AppText>
      <AppText variant="display" as="h1" className="mt-3 text-ink">
        {title}
      </AppText>
      {subtitle ? (
        <AppText variant="voice" className="mt-3 text-ink-2">
          {subtitle}
        </AppText>
      ) : null}

      <div className="mt-8 flex flex-col gap-5">{children}</div>

      {footer ? <div className="mt-8">{footer}</div> : null}
    </main>
  );
}
