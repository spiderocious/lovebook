import { type ReactNode } from 'react';

import { cn } from '../utils/cn.ts';

/**
 * InlineBanner — the in-feed amber strip (offline, code-expiring).
 *
 * Visual spec: dockito/design-system/projects/lovefeed/preview/22-feed-states.html (offline strip)
 *              and 41-feedback.html (.banner.wait)
 * Tokens:      _foundation.css (--wait, --wait-bg, --wait-edge)
 *
 * Amber, factual, the loudest offline ever gets. Distinct from the imperative
 * BannerHost (DrawerService) — this is a banner you place inline in a layout.
 * Only `wait` tone exists by the system's rules (no red strips; nothing here is
 * critical).
 */
export interface InlineBannerProps {
  children: ReactNode;
  className?: string;
}

export function InlineBanner({ children, className }: InlineBannerProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-card border border-wait-edge bg-wait-bg px-4 py-3 text-[13px] text-wait',
        className,
      )}
    >
      <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-current" />
      {children}
    </div>
  );
}
