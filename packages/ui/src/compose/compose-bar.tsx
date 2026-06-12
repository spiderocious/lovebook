import { type ReactNode } from 'react';
import { Camera, Mic, Pencil } from 'lucide-react';

import { cn } from '../utils/cn.ts';

/**
 * ComposeBar — the segmented labelled pill. Three doors, pinned to the bottom.
 *
 * Visual spec: dockito/design-system/projects/lovebook/preview/21-compose.html (.compose-bar)
 * Tokens:      _foundation.css (--r-bar, --shade-float, --plum-wash)
 *
 * Photo, Voice, Note. The labels stay — a first-time parent should never have to
 * guess an icon. The active door takes a plum wash. `onCompose` fires with the
 * chosen door.
 */
export type ComposeDoor = 'photo' | 'voice' | 'note';

export interface ComposeBarProps {
  active?: ComposeDoor;
  onCompose: (door: ComposeDoor) => void;
  className?: string;
}

const DOORS: ReadonlyArray<{ key: ComposeDoor; label: string; icon: ReactNode }> = [
  { key: 'photo', label: 'Photo', icon: <Camera size={17} strokeWidth={1.7} /> },
  { key: 'voice', label: 'Voice', icon: <Mic size={17} strokeWidth={1.7} /> },
  { key: 'note', label: 'Note', icon: <Pencil size={17} strokeWidth={1.7} /> },
];

export function ComposeBar({ active, onCompose, className }: ComposeBarProps) {
  return (
    <div
      className={cn(
        'flex max-w-[360px] items-stretch overflow-hidden rounded-bar border border-hair bg-print shadow-float',
        className,
      )}
    >
      {DOORS.map((door, i) => (
        <button
          key={door.key}
          type="button"
          onClick={() => onCompose(door.key)}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 py-3.5 font-sans text-[12px] font-semibold transition-colors',
            i > 0 && 'border-l border-hair',
            active === door.key ? 'bg-plum-wash text-plum' : 'text-ink-2 hover:bg-plum-wash hover:text-plum',
          )}
        >
          {door.icon}
          {door.label}
        </button>
      ))}
    </div>
  );
}
