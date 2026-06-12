import { cn } from '../utils/cn.ts';

/**
 * Skeleton — loading shapes that mirror the real moments.
 *
 * Visual spec: dockito/design-system/projects/lovefeed/preview/22-feed-states.html (.skel)
 * Tokens:      _foundation.css (--paper-deep, --r-print) + the `breathe` keyframe
 *
 * They breathe slowly; nothing spins. `kind="polaroid"` is a frame + a pencil
 * line; `kind="postcard"` is two text lines.
 */
export interface SkeletonProps {
  kind?: 'polaroid' | 'postcard';
  className?: string;
}

export function Skeleton({ kind = 'polaroid', className }: SkeletonProps) {
  return (
    <div className={cn('max-w-[320px] rounded-print border border-hair px-2.5 pt-2.5', className)}>
      {kind === 'polaroid' ? (
        <>
          <div className="aspect-[4/3] animate-breathe rounded-[2px] bg-paper-deep" />
          <div className="my-3.5 h-3 w-[45%] animate-breathe rounded-md bg-paper-deep" />
        </>
      ) : (
        <div className="py-1.5">
          <div className="my-3 h-4 w-[88%] animate-breathe rounded-md bg-paper-deep" />
          <div className="my-3 h-3 w-[60%] animate-breathe rounded-md bg-paper-deep" />
        </div>
      )}
    </div>
  );
}
