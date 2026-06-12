import { forwardRef, useState, type InputHTMLAttributes } from 'react';

import { cn } from '../../utils/cn.ts';

/**
 * LineField — the locked composer. A bare serif line on the paper.
 *
 * Visual spec: dockito/design-system/projects/lovefeed/preview/11-inputs.html (.f-line)
 * Tokens:      _foundation.css (.f-line, :262-276)
 *
 * The field is invisible until you write: no box, just an underline that turns
 * plum on focus. Serif, 20px — your words look like your words while you type.
 * When `maxLength` is set, the optional counter ambers at the limit and input
 * simply stops (no error, no shake — 200 characters is the form, like a
 * postcard's edge).
 */
export interface LineFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'defaultValue'> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  showCounter?: boolean;
}

export const LineField = forwardRef<HTMLInputElement, LineFieldProps>(function LineField(
  { value, defaultValue, onValueChange, showCounter, maxLength, className, ...rest },
  ref,
) {
  const isControlled = value !== undefined;
  const [inner, setInner] = useState(defaultValue ?? '');
  const current = isControlled ? value : inner;
  const atLimit = maxLength !== undefined && current.length >= maxLength;

  return (
    <div className="w-full">
      <input
        ref={ref}
        value={current}
        maxLength={maxLength}
        onChange={(e) => {
          if (!isControlled) setInner(e.target.value);
          onValueChange?.(e.target.value);
        }}
        className={cn(
          'w-full border-0 border-b border-hair-strong bg-transparent pb-2.5 font-serif text-[20px] text-ink outline-none',
          'placeholder:italic placeholder:text-ink-4 focus:border-plum',
          className,
        )}
        {...rest}
      />
      {showCounter && maxLength !== undefined ? (
        <div
          className={cn(
            'mt-2 font-mono text-[11.5px] [font-feature-settings:"tnum"_1,"lnum"_1]',
            atLimit ? 'text-wait' : 'text-ink-3',
          )}
        >
          {current.length} / {maxLength}
        </div>
      ) : null}
    </div>
  );
});
