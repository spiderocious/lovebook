import { cn } from '../../utils/cn.ts';

/**
 * Avatar — there are only ever two people.
 *
 * Visual spec: dockito/design-system/projects/lovefeed/preview/23-avatars-stamps.html (.av)
 * Tokens:      _foundation.css (.av, :295-308)
 *
 * `who="you"` is filled plum; `who="them"` is a plum wash — tellable apart at
 * 24px without reading a name. Renders the person's initial. In Lamplight the
 * fill flips to dark text automatically via the token override.
 */
export type AvatarWho = 'you' | 'them';
export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  initial: string;
  who?: AvatarWho;
  size?: AvatarSize;
  className?: string;
}

const SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-[12px]',
  lg: 'h-12 w-12 text-[17px]',
  xl: 'h-[72px] w-[72px] text-[24px]',
};

export function Avatar({ initial, who = 'you', size = 'md', className }: AvatarProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full font-sans font-semibold',
        who === 'you' ? 'bg-plum text-print' : 'bg-plum-wash-2 text-plum',
        SIZE_CLASSES[size],
        className,
      )}
    >
      {initial}
    </span>
  );
}

/**
 * PairMark — the two avatars overlapping.
 *
 * Appears in exactly two places: the pairing confirmation and the
 * year-in-review cover. `you` overlaps `them` with a print-coloured ring.
 */
export interface PairMarkProps {
  you: string;
  them: string;
  size?: AvatarSize;
  className?: string;
}

export function PairMark({ you, them, size = 'lg', className }: PairMarkProps) {
  return (
    <span className={cn('inline-flex items-center', className)}>
      <Avatar initial={you} who="you" size={size} />
      <Avatar
        initial={them}
        who="them"
        size={size}
        className="-ml-2 ring-2 ring-print"
      />
    </span>
  );
}
