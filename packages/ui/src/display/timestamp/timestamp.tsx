import { useState } from 'react';

import { cn } from '../../utils/cn.ts';

/**
 * Timestamp — human first, exact on request.
 *
 * Visual spec: dockito/design-system/projects/lovebook/preview/23-avatars-stamps.html (timestamps)
 * Tokens:      _foundation.css (.stampnote, .rec)
 *
 * Written the way you'd say it across a kitchen table ("just now", "2h ago",
 * "last Tuesday", "March 14"). The exact mono record exists but hides behind a
 * tap/long-press — the record is kept, not displayed. Pass `now` to keep the
 * humanizer pure/testable (defaults to the render-time clock).
 */
export interface TimestampProps {
  date: Date | string | number;
  now?: Date;
  className?: string;
}

const WEEKDAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const pad = (n: number): string => String(n).padStart(2, '0');

export function humanizeTimestamp(date: Date, now: Date): string {
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHr = Math.floor(diffMs / 3_600_000);
  const diffDay = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return 'just now';
  if (diffHr < 24) return `${Math.max(diffHr, 1)}h ago`;
  if (diffDay === 1) return date.getHours() < 12 ? 'yesterday morning' : 'yesterday evening';
  if (diffDay < 7) return `last ${WEEKDAY[date.getDay()] ?? ''}`.trim();
  if (date.getFullYear() === now.getFullYear()) return `${MONTH[date.getMonth()] ?? ''} ${date.getDate()}`;
  return `${MONTH[date.getMonth()] ?? ''} ${date.getDate()}, ${date.getFullYear()}`;
}

export function exactTimestamp(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} · ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function Timestamp({ date, now, className }: TimestampProps) {
  const [exact, setExact] = useState(false);
  const d = date instanceof Date ? date : new Date(date);
  const reference = now ?? new Date();

  return (
    <button
      type="button"
      onClick={() => setExact((v) => !v)}
      title="Tap for the exact time"
      className={cn(
        exact
          ? 'font-mono text-[11.5px] text-ink-3 [font-feature-settings:"tnum"_1,"lnum"_1]'
          : 'font-serif text-[14px] italic text-ink-3',
        'cursor-pointer bg-transparent',
        className,
      )}
    >
      {exact ? exactTimestamp(d) : humanizeTimestamp(d, reference)}
    </button>
  );
}
