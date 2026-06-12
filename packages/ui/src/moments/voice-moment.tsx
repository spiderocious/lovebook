import { type ReactNode } from 'react';

import { cn } from '../utils/cn.ts';

/**
 * VoiceMoment — a voice moment. The only flat card, because sound has no surface.
 *
 * Visual spec: dockito/design-system/projects/lovefeed/preview/20-moments.html (.voicecard)
 * Tokens:      _foundation.css (.sheet, --plum, --r-card)
 *
 * The waveform is real amplitude (a `number[]` of 0–1 the app supplies — the
 * library does no audio decoding), and bars before `progress` turn plum behind
 * the playhead. Thirty seconds max keeps it a moment, not a message. `queued`
 * renders the dashed-edge offline state; it sends itself, so no retry button.
 */
export interface VoiceMomentProps {
  /** Amplitudes 0..1, one per bar. */
  waveform: ReadonlyArray<number>;
  /** Playback position 0..1 — bars before it render as played. */
  progress?: number;
  duration: string;
  author?: ReactNode;
  timestamp?: ReactNode;
  reaction?: ReactNode;
  playing?: boolean;
  onPlayToggle?: () => void;
  queued?: ReactNode;
  className?: string;
}

export function VoiceMoment({
  waveform,
  progress = 0,
  duration,
  author,
  timestamp,
  reaction,
  playing,
  onPlayToggle,
  queued,
  className,
}: VoiceMomentProps) {
  const playedBars = Math.round(progress * waveform.length);

  return (
    <div
      className={cn(
        'max-w-[320px] rounded-card border bg-print px-[18px] py-4',
        queued ? 'border-dashed border-wait-edge' : 'border-print-edge',
        className,
      )}
    >
      <div className="flex items-center gap-3.5">
        <button
          type="button"
          onClick={onPlayToggle}
          aria-label={playing ? 'Pause' : 'Play'}
          className={cn(
            'flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full text-[13px]',
            queued ? 'bg-wait-bg text-wait' : 'bg-plum text-print',
          )}
        >
          {playing ? '❚❚' : '▶'}
        </button>
        <div className="flex h-[34px] flex-1 items-center gap-[3px]">
          {waveform.map((amp, i) => (
            <span
              key={i}
              className={cn('min-w-[2px] flex-1 rounded-full', i < playedBars ? 'bg-plum' : 'bg-hair-strong')}
              style={{ height: `${Math.max(amp, 0.08) * 100}%` }}
            />
          ))}
        </div>
        <span className="font-mono text-[12px] text-ink-3 [font-feature-settings:'tnum'_1,'lnum'_1]">
          {duration}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-hair pt-2.5">
        {queued ? (
          queued
        ) : (
          <>
            {author || timestamp ? (
              <span className="font-serif text-[14px] italic text-ink-3">
                {author}
                {author && timestamp ? ' · ' : ''}
                {timestamp}
              </span>
            ) : (
              <span />
            )}
            {reaction}
          </>
        )}
      </div>
    </div>
  );
}
