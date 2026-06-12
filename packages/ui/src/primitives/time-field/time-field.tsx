import { forwardRef, type InputHTMLAttributes } from 'react';

import { cn } from '../../utils/cn.ts';

/**
 * TimeField — a time as a mono pill. The record idiom.
 *
 * Visual spec: dockito/design-system/projects/lovefeed/preview/11-inputs.html (.timefield)
 * Tokens:      _foundation.css — --mono, --r-pill
 *
 * Quiet hours and any HH:MM value. The control stays wordless — a mono pill, no
 * label inside it. Renders a native `type="time"` input styled as the pill so it
 * is genuinely editable, not a display of a value.
 */
export interface TimeFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {}

export const TimeField = forwardRef<HTMLInputElement, TimeFieldProps>(function TimeField(
  { className, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      type="time"
      className={cn(
        'inline-flex items-center rounded-pill border border-hair-strong bg-paper px-4 py-2',
        'font-mono text-[15px] text-ink outline-none [font-feature-settings:"tnum"_1,"lnum"_1]',
        'focus:border-plum focus-visible:ring-[3px] focus-visible:ring-plum-wash',
        className,
      )}
      {...rest}
    />
  );
});
