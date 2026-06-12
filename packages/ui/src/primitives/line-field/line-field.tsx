import {
  forwardRef,
  useLayoutEffect,
  useRef,
  useState,
  type TextareaHTMLAttributes,
} from 'react';

import { cn } from '../../utils/cn.ts';

/**
 * LineField — the locked composer. A bare serif line on the paper.
 *
 * Visual spec: dockito/design-system/projects/lovefeed/preview/11-inputs.html (.f-line)
 * Tokens:      _foundation.css (.f-line, :262-276)
 *
 * The field is invisible until you write: no box, just an underline that turns
 * plum on focus. Serif, 20px — your words look like your words while you type.
 *
 * It is a **textarea**, not an input: a real post can run past one line, so it
 * grows downward as you type (the underline travels with the last line). When
 * `maxLength` is set the optional counter ambers at the limit and input simply
 * stops — 200 characters is the form, like a postcard's edge.
 */
export interface LineFieldProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value' | 'defaultValue' | 'rows'> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  showCounter?: boolean;
}

export const LineField = forwardRef<HTMLTextAreaElement, LineFieldProps>(function LineField(
  { value, defaultValue, onValueChange, showCounter, maxLength, className, ...rest },
  ref,
) {
  const isControlled = value !== undefined;
  const [inner, setInner] = useState(defaultValue ?? '');
  const current = isControlled ? value : inner;
  const atLimit = maxLength !== undefined && current.length >= maxLength;

  // Auto-grow: keep the textarea exactly as tall as its content (no inner scroll).
  const localRef = useRef<HTMLTextAreaElement | null>(null);
  const setRefs = (node: HTMLTextAreaElement | null) => {
    localRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };
  useLayoutEffect(() => {
    const el = localRef.current;
    if (el === null) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [current]);

  return (
    <div className="w-full">
      <textarea
        ref={setRefs}
        rows={1}
        value={current}
        maxLength={maxLength}
        onChange={(e) => {
          if (!isControlled) setInner(e.target.value);
          onValueChange?.(e.target.value);
        }}
        className={cn(
          'block w-full resize-none overflow-hidden border-0 border-b border-hair-strong bg-transparent pb-2.5 font-serif text-[20px] leading-snug text-ink outline-none',
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
