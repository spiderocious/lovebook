import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

import { cn } from '../../utils/cn.ts';

/**
 * ChromeField — the quiet, last-in-line field. Auth and profile.
 *
 * Visual spec: dockito/design-system/projects/lovefeed/preview/11-inputs.html (.f)
 * Tokens:      _foundation.css (.f, :278-293)
 *
 * Same bare-line idiom as the composer, but smaller and in sans — these are the
 * machine's fields (email, password, display name), so they come last and stay
 * quiet. Pass `mono` for code-shaped values.
 */
export interface ChromeFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  mono?: boolean;
}

export const ChromeField = forwardRef<HTMLInputElement, ChromeFieldProps>(function ChromeField(
  { label, mono, className, id, ...rest },
  ref,
) {
  return (
    <label className="block w-full" htmlFor={id}>
      {label ? (
        <span className="mb-1 block font-sans text-[12px] font-semibold text-ink-3">{label}</span>
      ) : null}
      <input
        ref={ref}
        id={id}
        className={cn(
          'h-[34px] w-full border-0 border-b border-hair-strong bg-transparent pb-1 text-[14px] text-ink outline-none',
          'placeholder:text-ink-4 focus:border-plum',
          mono ? 'font-mono [font-feature-settings:"tnum"_1,"lnum"_1]' : 'font-sans',
          className,
        )}
        {...rest}
      />
    </label>
  );
});
