import { type ReactNode } from 'react';

import { cn } from '../../utils/cn.ts';

/**
 * Feedback primitives — Toast and Banner.
 *
 * Visual spec: dockito/design-system/projects/lovebook/preview/41-feedback.html
 * Tokens:      _foundation.css (.toast, .banner, --ink, --wait)
 *
 * Toast is the only inverted (ink-filled) element in the product, so it is
 * legible over any photo. Banner is the one persistent amber strip; banners
 * never stack — if two things are wrong, the worse one speaks.
 */
export type FeedbackTone = 'default' | 'ok' | 'wait' | 'crit';

const TOAST_DOT: Record<FeedbackTone, string> = {
  default: 'bg-ink-4',
  ok: 'bg-[#9DC79B]',
  wait: 'bg-[#DDB873]',
  crit: 'bg-[#E0596B]',
};

export interface ToastProps {
  tone?: FeedbackTone;
  children: ReactNode;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function Toast({ tone = 'default', children, action, className }: ToastProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2.5 rounded-pill bg-ink px-[18px] py-2.5 font-sans text-[13px] font-medium text-paper shadow-float',
        className,
      )}
    >
      <span className={cn('h-[7px] w-[7px] rounded-full', TOAST_DOT[tone])} />
      <span>{children}</span>
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="ml-2 cursor-pointer border-0 bg-transparent font-sans text-[13px] font-semibold text-paper underline decoration-2 underline-offset-[3px]"
        >
          {action.label}
        </button>
      ) : null}
    </div>
  );
}

const BANNER_TONE: Record<FeedbackTone, string> = {
  default: 'border-hair bg-print text-ink-2',
  ok: 'border-ok-edge bg-ok-bg text-ok',
  wait: 'border-wait-edge bg-wait-bg text-wait',
  crit: 'border-crit-edge bg-crit-bg text-crit',
};

export interface BannerProps {
  tone?: FeedbackTone;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  cta?: { label: string; onClick: () => void };
  className?: string;
}

export function Banner({ tone = 'wait', title, description, icon, cta, className }: BannerProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-card border px-4 py-3 text-[13px]',
        BANNER_TONE[tone],
        className,
      )}
    >
      {icon ?? <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-current" />}
      <div className="min-w-0 flex-1">
        <span className="font-semibold">{title}</span>
        {description ? <span className="ml-1 opacity-90">{description}</span> : null}
      </div>
      {cta ? (
        <button
          type="button"
          onClick={cta.onClick}
          className="shrink-0 cursor-pointer border-0 bg-transparent font-sans text-[13px] font-semibold underline underline-offset-[3px]"
        >
          {cta.label}
        </button>
      ) : null}
    </div>
  );
}
