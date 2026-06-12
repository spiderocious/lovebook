import { type ReactNode } from 'react';

import { cn } from '../utils/cn.ts';

/**
 * PolaroidMoment — a photo moment. A tilted print, named in pencil.
 *
 * Visual spec: dockito/design-system/projects/lovefeed/preview/20-moments.html (.polaroid)
 * Tokens:      _foundation.css (.keepsake, --shade-keepsake, --r-print)
 *
 * The author's name in pencil-italic, the reaction sitting where a thumb would
 * hold the print. Tilt alternates per row, never exceeding ~1.2°. The photo is
 * never filtered, dimmed, or cropped — including in Lamplight. `loading` lands
 * the frame and pencil note first (presence before pixels). Pass a rendered
 * `reaction` (a ReactionButton) and `timestamp` (a Timestamp) so the moment
 * stays a pure presentation shell.
 */
export interface PolaroidMomentProps {
  src?: string;
  alt?: string;
  author: string;
  timestamp?: ReactNode;
  reaction?: ReactNode;
  tilt?: 'left' | 'right' | 'none';
  loading?: boolean;
  /** A CSS background (gradient) used when no `src` is given — for demos/empty. */
  fallbackBackground?: string;
  className?: string;
}

const TILT: Record<NonNullable<PolaroidMomentProps['tilt']>, string> = {
  left: '-rotate-[1.2deg]',
  right: 'rotate-[0.8deg]',
  none: '',
};

export function PolaroidMoment({
  src,
  alt = '',
  author,
  timestamp,
  reaction,
  tilt = 'left',
  loading,
  fallbackBackground,
  className,
}: PolaroidMomentProps) {
  return (
    <div
      className={cn(
        'max-w-[320px] rounded-print border border-print-edge bg-print px-2.5 pt-2.5 shadow-keepsake',
        TILT[tilt],
        className,
      )}
    >
      <div className="aspect-square overflow-hidden rounded-[2px]">
        {loading ? (
          <div className="flex h-full w-full items-center justify-center bg-paper-deep">
            <span className="font-mono text-[11.5px] text-ink-3">loading…</span>
          </div>
        ) : src !== undefined ? (
          <img src={src} alt={alt} className="h-full w-full object-cover" />
        ) : (
          <div
            className="h-full w-full"
            style={fallbackBackground !== undefined ? { background: fallbackBackground } : undefined}
          />
        )}
      </div>
      <div className="flex min-h-[56px] items-center justify-between px-1 pb-[15px] pt-[13px]">
        <div className="font-serif text-[15.5px] italic text-ink">
          {author}
          {timestamp ? <span className="ml-1 block text-[13px] text-ink-3">{timestamp}</span> : null}
        </div>
        {reaction}
      </div>
    </div>
  );
}
