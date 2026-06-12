import { useCallback, useRef, useState, type ReactNode } from 'react';

import { cn } from '../../utils/cn.ts';

/**
 * HoldToConfirmButton — the crimson door.
 *
 * Visual spec: dockito/design-system/projects/lovefeed/preview/10-buttons.html (.hold)
 *              and 40-modals.html (the leave-pair foot)
 * Tokens:      _foundation.css — --crit / --crit-bg
 *
 * A tap can be a slip; a held second is a decision. The crimson fills the pill
 * over `durationMs` (default 1.2s); releasing early cancels. Used only for the
 * leave-pair door. Keyboard: Space/Enter held works the same way.
 */
export interface HoldToConfirmButtonProps {
  onConfirm: () => void;
  children?: ReactNode;
  confirmingLabel?: ReactNode;
  durationMs?: number;
  disabled?: boolean;
  className?: string;
}

export function HoldToConfirmButton({
  onConfirm,
  children = 'Hold to leave',
  confirmingLabel,
  durationMs = 1200,
  disabled = false,
  className,
}: HoldToConfirmButtonProps) {
  const [holding, setHolding] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = useCallback(() => {
    if (disabled || holding) return;
    setHolding(true);
    timer.current = setTimeout(() => {
      setHolding(false);
      onConfirm();
    }, durationMs);
  }, [disabled, holding, durationMs, onConfirm]);

  const cancel = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    setHolding(false);
  }, []);

  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          start();
        }
      }}
      onKeyUp={(e) => {
        if (e.key === ' ' || e.key === 'Enter') cancel();
      }}
      className={cn(
        'relative inline-flex h-11 select-none items-center justify-center overflow-hidden whitespace-nowrap rounded-pill px-6',
        'bg-crit-bg font-sans text-[14px] font-semibold text-crit',
        'transition-colors duration-[140ms] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-crit-edge',
        'disabled:cursor-not-allowed disabled:opacity-40',
        className,
      )}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 bg-crit ease-linear"
        style={{ width: holding ? '100%' : '0%', transition: `width ${durationMs}ms linear` }}
      />
      <span className={cn('relative z-10', holding && 'text-print')}>
        {holding ? (confirmingLabel ?? children) : children}
      </span>
    </button>
  );
}
