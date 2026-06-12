import { cn } from '../../utils/cn.ts';

/**
 * ReactionPicker — the floating pill of six. Long-press on a moment.
 *
 * Visual spec: dockito/design-system/projects/lovefeed/preview/12-reactions.html (.picker)
 * Tokens:      _foundation.css (.picker, --r-bar, --shade-float)
 *
 * Six choices, fixed — the constraint is the charm. Controlled: the parent
 * decides when it is open (it settles in over the moment's lower edge on
 * long-press) and which emoji is `selected`. The default set matches the spec;
 * override with `options`.
 */
export const DEFAULT_REACTIONS = ['❤️', '🥹', '😂', '😮', '🫶', '🔥'] as const;

export interface ReactionPickerProps {
  selected?: string;
  onSelect: (emoji: string) => void;
  options?: ReadonlyArray<string>;
  className?: string;
}

export function ReactionPicker({
  selected,
  onSelect,
  options = DEFAULT_REACTIONS,
  className,
}: ReactionPickerProps) {
  return (
    <div
      role="menu"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-bar border border-hair bg-print px-3 py-2 shadow-float',
        'animate-settle',
        className,
      )}
    >
      {options.map((emoji) => (
        <button
          key={emoji}
          type="button"
          role="menuitemradio"
          aria-checked={selected === emoji}
          aria-label={`React ${emoji}`}
          onClick={() => onSelect(emoji)}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full text-[19px]',
            'transition-[background-color,transform] duration-[140ms] ease-settle hover:-translate-y-0.5 hover:bg-plum-wash-2',
            selected === emoji && 'bg-plum-wash-2',
          )}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
