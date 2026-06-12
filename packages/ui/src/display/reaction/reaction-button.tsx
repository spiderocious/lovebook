import { cn } from '../../utils/cn.ts';

/**
 * ReactionButton — one reaction per moment. A note on the back of a print.
 *
 * Visual spec: dockito/design-system/projects/lovefeed/preview/12-reactions.html (.react)
 *              and 20-moments.html (in situ on a moment)
 * Tokens:      _foundation.css (.react, :324-334)
 *
 * Empty is an outline heart; a left reaction sits in a plum wash. There is no
 * count, ever — a reaction is a note, not a score. `emoji` undefined renders the
 * empty state. `changing` shows the dashed border (long-press-again to replace).
 */
export interface ReactionButtonProps {
  emoji?: string;
  changing?: boolean;
  onClick?: () => void;
  'aria-label'?: string;
  className?: string;
}

export function ReactionButton({
  emoji,
  changing,
  onClick,
  'aria-label': ariaLabel,
  className,
}: ReactionButtonProps) {
  const hasReaction = emoji !== undefined && emoji.length > 0;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel ?? (hasReaction ? `Reacted ${emoji}` : 'React')}
      className={cn(
        'inline-flex h-[38px] w-[38px] items-center justify-center rounded-full border text-[16px]',
        'transition-[background-color,transform] duration-[140ms] ease-settle hover:bg-plum-wash',
        hasReaction ? 'border-transparent bg-plum-wash' : 'border-hair-strong bg-transparent',
        changing && 'border-dashed border-plum',
        className,
      )}
    >
      {hasReaction ? emoji : <span className="text-ink-3">♡</span>}
    </button>
  );
}
