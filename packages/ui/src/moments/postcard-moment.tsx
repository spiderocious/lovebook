import { type ReactNode } from 'react';

import { cn } from '../utils/cn.ts';

/**
 * PostcardMoment — a text moment. Your handwriting, big, on a postcard.
 *
 * Visual spec: dockito/design-system/projects/lovefeed/preview/20-moments.html (.postcard)
 * Tokens:      _foundation.css (.keepsake, --serif, --plum)
 *
 * The serif is 20px because 200 characters deserve to be read, not skimmed. The
 * faded quote mark is the only ornament in the entire system. The dotted rule
 * carries the timestamp and reaction. `failed` renders the gentle grey
 * couldn't-load line with a quiet retry (no red — nothing here is critical).
 */
export interface PostcardMomentProps {
  text: ReactNode;
  timestamp?: ReactNode;
  reaction?: ReactNode;
  tilt?: 'right' | 'none';
  failed?: boolean;
  retry?: ReactNode;
  className?: string;
}

export function PostcardMoment({
  text,
  timestamp,
  reaction,
  tilt = 'none',
  failed,
  retry,
  className,
}: PostcardMomentProps) {
  return (
    <div
      className={cn(
        'max-w-[320px] rounded-print border border-print-edge bg-print px-[22px] pb-3.5 pt-[22px] shadow-keepsake',
        tilt === 'right' && 'rotate-[0.6deg]',
        className,
      )}
    >
      {failed ? (
        <p className="m-0 font-serif text-[20px] leading-snug text-ink-3">This moment couldn’t load.</p>
      ) : (
        <>
          <span className="mb-3 block font-display text-[36px] leading-[0.4] text-plum opacity-40">“</span>
          <p className="m-0 mb-3.5 font-serif text-[20px] leading-relaxed text-ink">{text}</p>
        </>
      )}
      <div className="flex items-center justify-between border-t border-dotted border-hair-strong pt-[11px]">
        {timestamp ? (
          <span className="font-serif text-[14px] italic text-ink-3">{timestamp}</span>
        ) : (
          <span />
        )}
        {failed ? retry : reaction}
      </div>
    </div>
  );
}
