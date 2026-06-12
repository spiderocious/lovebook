import { Mic } from 'lucide-react';

import { cn } from '../utils/cn.ts';

/**
 * VoiceRecorder — hold to record, release to preview.
 *
 * Visual spec: dockito/design-system/projects/lovefeed/preview/21-compose.html (.recorder)
 * Tokens:      _foundation.css (--plum, --plum-wash, --mono)
 *
 * The WhatsApp muscle memory, kept. The ring around the mic is the only fanfare.
 * At the max recording simply stops. This is presentational — the app drives the
 * `seconds` and the live `waveform` (amplitudes 0..1) and wires the hold gesture
 * via `onHoldStart`/`onHoldEnd`; the library does no audio capture.
 */
export interface VoiceRecorderProps {
  seconds: number;
  maxSeconds?: number;
  waveform: ReadonlyArray<number>;
  recording?: boolean;
  onHoldStart?: () => void;
  onHoldEnd?: () => void;
  className?: string;
}

const fmt = (total: number): string => {
  const m = Math.floor(total / 60);
  const s = Math.floor(total % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
};

export function VoiceRecorder({
  seconds,
  maxSeconds = 30,
  waveform,
  recording,
  onHoldStart,
  onHoldEnd,
  className,
}: VoiceRecorderProps) {
  return (
    <div className={cn('px-2 py-2 text-center', className)}>
      <button
        type="button"
        aria-label="Hold to record"
        onPointerDown={onHoldStart}
        onPointerUp={onHoldEnd}
        onPointerLeave={onHoldEnd}
        className="mx-auto mb-[18px] flex h-[88px] w-[88px] items-center justify-center rounded-full bg-plum text-print shadow-[0_0_0_12px_var(--plum-wash),0_0_0_24px_var(--plum-wash)]"
      >
        <Mic size={32} strokeWidth={1.7} />
      </button>
      <div className="mx-auto my-3.5 flex h-[30px] max-w-[220px] items-center justify-center gap-[3px]">
        {waveform.map((amp, i) => (
          <span
            key={i}
            className="w-[3px] rounded-full bg-plum"
            style={{ height: `${Math.max(amp, 0.1) * 100}%`, opacity: recording ? 1 : 0.5 }}
          />
        ))}
      </div>
      <div className="font-mono text-[26px] font-medium text-ink [font-feature-settings:'tnum'_1,'lnum'_1]">
        {fmt(seconds)}
      </div>
      <div className="font-mono text-[12px] text-ink-3">of {fmt(maxSeconds)}</div>
    </div>
  );
}
