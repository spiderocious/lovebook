import { type ReactNode } from 'react';

import { cn } from '../../utils/cn.ts';

/**
 * StatusPill — the quiet status mark. One of five, ever.
 *
 * Visual spec: dockito/design-system/projects/lovebook/preview/23-avatars-stamps.html (.pill)
 * Tokens:      _foundation.css (.pill, :310-322)
 *
 * `ok` (moss) for connected/delivered/paired; `wait` (amber) for queued/offline/
 * expiring; `crit` (crimson) for the one "pair dissolved" in the archive. The dot
 * never animates — presence is the posts, not surveillance. `dotOnly` shrinks it
 * to the bare dot for a top bar.
 */
export type StatusTone = 'ok' | 'wait' | 'crit';

export interface StatusPillProps {
  tone: StatusTone;
  children?: ReactNode;
  dotOnly?: boolean;
  className?: string;
}

const TONE_CLASSES: Record<StatusTone, string> = {
  ok: 'text-ok border-ok-edge bg-ok-bg',
  wait: 'text-wait border-wait-edge bg-wait-bg',
  crit: 'text-crit border-crit-edge bg-crit-bg',
};

const DOT_BG: Record<StatusTone, string> = {
  ok: 'bg-ok',
  wait: 'bg-wait',
  crit: 'bg-crit',
};

export function StatusPill({ tone, children, dotOnly, className }: StatusPillProps) {
  if (dotOnly) {
    return <span className={cn('inline-block h-2 w-2 rounded-full', DOT_BG[tone], className)} />;
  }
  return (
    <span
      className={cn(
        'inline-flex h-[22px] items-center gap-1.5 whitespace-nowrap rounded-pill border px-2.5',
        'font-sans text-[11px] font-medium',
        TONE_CLASSES[tone],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}
