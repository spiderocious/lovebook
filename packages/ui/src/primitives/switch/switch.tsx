import { cn } from '../../utils/cn.ts';

/**
 * Switch — the product's only selection control.
 *
 * Visual spec: dockito/design-system/projects/lovebook/preview/12-reactions.html (.sw)
 * Tokens:      _foundation.css — --plum, --hair-strong, --print
 *
 * No checkboxes, no radio groups, no dropdowns anywhere in v1 — the product has
 * so few choices that the switch covers all of them. On is plum; off is a
 * hairline track. Renders a real `role="switch"` button.
 */
export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  'aria-label'?: string;
  className?: string;
}

export function Switch({
  checked,
  onCheckedChange,
  disabled,
  'aria-label': ariaLabel,
  className,
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative h-[26px] w-11 shrink-0 rounded-pill transition-colors duration-[140ms]',
        'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-plum-wash-2',
        'disabled:cursor-not-allowed disabled:opacity-40',
        checked ? 'bg-plum' : 'bg-hair-strong',
        className,
      )}
    >
      <span
        className={cn(
          'absolute top-[3px] h-5 w-5 rounded-full bg-print transition-[left] duration-[140ms] ease-settle',
          checked ? 'left-[21px]' : 'left-[3px]',
        )}
      />
    </button>
  );
}
