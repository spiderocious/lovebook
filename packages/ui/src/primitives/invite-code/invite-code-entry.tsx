import { useId, useRef, useState } from 'react';

import { cn } from '../../utils/cn.ts';

/**
 * InviteCodeEntry — the one boxed input in the product.
 *
 * Visual spec: dockito/design-system/projects/lovebook/preview/11-inputs.html (.codeboxes)
 * Tokens:      _foundation.css — --mono, --plum, --hair-strong
 *
 * Six cells on the receiver's side, because each character is an object you were
 * handed. This is a REAL input: a visually-hidden text input captures keystrokes
 * (including mobile keyboards and paste) and the cells render its value. Format
 * is `ABC-DEF` (a dash between the two triplets is presentation only).
 *
 * Controlled (`value` + `onChange`) or uncontrolled (`defaultValue`). Fires
 * `onComplete` once the sixth character lands.
 */
const LENGTH = 6;

export interface InviteCodeEntryProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  autoFocus?: boolean;
  disabled?: boolean;
  className?: string;
}

const sanitize = (raw: string): string =>
  raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, LENGTH);

export function InviteCodeEntry({
  value,
  defaultValue,
  onChange,
  onComplete,
  autoFocus,
  disabled,
  className,
}: InviteCodeEntryProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const isControlled = value !== undefined;
  const [inner, setInner] = useState(sanitize(defaultValue ?? ''));
  const [focused, setFocused] = useState(false);
  const current = isControlled ? sanitize(value) : inner;

  const update = (raw: string) => {
    const next = sanitize(raw);
    if (!isControlled) setInner(next);
    onChange?.(next);
    if (next.length === LENGTH) onComplete?.(next);
  };

  const cells = Array.from({ length: LENGTH }, (_, i) => current[i] ?? '');
  const activeIndex = Math.min(current.length, LENGTH - 1);

  return (
    <label htmlFor={inputId} className={cn('inline-flex items-center gap-2', className)}>
      <input
        ref={inputRef}
        id={inputId}
        value={current}
        onChange={(e) => update(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled}
        autoFocus={autoFocus}
        inputMode="text"
        autoCapitalize="characters"
        autoComplete="one-time-code"
        spellCheck={false}
        maxLength={LENGTH}
        aria-label="Invite code"
        className="absolute h-px w-px overflow-hidden opacity-0"
      />
      {cells.map((char, i) => (
        <CellAndMaybeDash key={i} index={i} char={char} active={focused && i === activeIndex} />
      ))}
    </label>
  );
}

function CellAndMaybeDash({
  index,
  char,
  active,
}: {
  index: number;
  char: string;
  active: boolean;
}) {
  return (
    <>
      {index === 3 ? <span className="px-0.5 text-[20px] text-ink-4">–</span> : null}
      <span
        className={cn(
          'flex h-14 w-[46px] items-center justify-center rounded-[10px] border bg-paper',
          'font-mono text-[22px] uppercase text-ink [font-feature-settings:"tnum"_1,"lnum"_1]',
          active ? 'border-plum ring-[3px] ring-plum-wash' : 'border-hair-strong',
        )}
      >
        {char}
      </span>
    </>
  );
}
