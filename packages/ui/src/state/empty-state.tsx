import { type ReactNode } from 'react';

import { cn } from '../utils/cn.ts';

/**
 * EmptyState — the kind, serif-voiced non-error states.
 *
 * Visual spec: dockito/design-system/projects/lovebook/preview/22-feed-states.html
 * Tokens:      _foundation.css (.voice, .stampnote)
 *
 * A two-person feed has states a public feed never has: "nothing yet, and that's
 * fine", "your person hasn't posted in a while", "you're offline". None of them
 * are errors. The serif speaks in every one — the system borrows the warm voice
 * only when the room is empty. There is no red, ever, here; failure stays gentle.
 * Only the brand-new-pair state carries an `action` (it nudges exactly once).
 */
export interface EmptyStateProps {
  message: ReactNode;
  note?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ message, note, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-3 py-8 text-center', className)}>
      <p className="m-0 mb-2 max-w-[26ch] font-serif text-[19px] leading-snug text-ink">{message}</p>
      {note ? <span className="font-serif text-[14px] italic text-ink-3">{note}</span> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
