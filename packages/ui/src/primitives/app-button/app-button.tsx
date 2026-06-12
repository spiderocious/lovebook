import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

import { cn } from '../../utils/cn.ts';

/**
 * AppButton — the locked pill family.
 *
 * Visual spec: dockito/design-system/projects/lovefeed/preview/10-buttons.html
 * Tokens:      dockito/design-system/projects/lovefeed/preview/_foundation.css (.b, :207-260)
 *
 * Four weights. `primary` is filled plum for the one thing the screen wants;
 * `secondary` is a plum wash for the alternative; `quiet` is "not now"; `danger`
 * is the crimson wash that only guards the two irreversible doors. Most screens
 * have exactly one primary — many have none.
 */
export type AppButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger';
export type AppButtonSize = 'sm' | 'md' | 'lg';

export interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

const VARIANT_CLASSES: Record<AppButtonVariant, string> = {
  primary: 'bg-plum text-print hover:bg-plum-deep',
  secondary: 'bg-plum-wash text-plum hover:bg-plum-wash-2',
  quiet: 'bg-transparent text-ink-3 hover:bg-plum-wash hover:text-ink',
  danger: 'bg-crit-bg text-crit hover:bg-crit hover:text-print',
};

const SIZE_CLASSES: Record<AppButtonSize, string> = {
  sm: 'h-9 px-[18px] text-[13px]',
  md: 'h-11 px-6 text-[14px]',
  lg: 'h-[50px] px-[30px] text-[15px]',
};

export const AppButton = forwardRef<HTMLButtonElement, AppButtonProps>(function AppButton(
  {
    variant = 'primary',
    size = 'md',
    className,
    loading,
    leadingIcon,
    trailingIcon,
    children,
    disabled,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-pill font-sans font-semibold',
        'transition-[background-color,color,transform] duration-[140ms] ease-settle',
        'active:translate-y-px focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-plum-wash-2',
        'disabled:cursor-not-allowed disabled:opacity-40',
        SIZE_CLASSES[size],
        VARIANT_CLASSES[variant],
        className,
      )}
      {...rest}
    >
      {leadingIcon ? <span className="-ml-0.5 inline-flex">{leadingIcon}</span> : null}
      <span>{loading ? 'One moment…' : children}</span>
      {trailingIcon ? <span className="-mr-0.5 inline-flex">{trailingIcon}</span> : null}
    </button>
  );
});
