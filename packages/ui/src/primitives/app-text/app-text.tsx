import { type HTMLAttributes, type ElementType, type ReactNode } from 'react';

import { cn } from '../../utils/cn.ts';

/**
 * AppText — the typographic voice of the shoebox.
 *
 * Visual spec: dockito/design-system/projects/lovefeed/preview/02-type.html
 * Tokens:      _foundation.css (.voice, .stampnote, .rec, .overline)
 *
 * The system's one hard rule lives here: **the serif belongs to humans.** The
 * `voice`/`scrawl` variants (Source Serif) are reserved for anything a person
 * wrote or said and the empty-room states; everything the machine says is
 * `body`/`label`/`overline` (Inter); `record` (JetBrains Mono) is for codes,
 * counts and durations; `display`/`ceremony` (Fraunces) is rare — covers and
 * the year-in-review only.
 */
export type AppTextVariant =
  | 'display' // Fraunces — covers, ceremony
  | 'ceremony' // Fraunces, smaller — pairing welcome
  | 'voice' // Source Serif — a human speaking; empty-room states
  | 'scrawl' // Source Serif italic — the pencil on the back of a print
  | 'heading' // Inter — chrome headings
  | 'body' // Inter — chrome body
  | 'body-sm' // Inter — secondary chrome
  | 'label' // Inter — field labels, captions
  | 'overline' // Inter — the uppercase eyebrow
  | 'record'; // JetBrains Mono — the record (codes, counts, durations)

export interface AppTextProps extends HTMLAttributes<HTMLElement> {
  variant?: AppTextVariant;
  as?: ElementType;
  children?: ReactNode;
}

const VARIANT_CLASSES: Record<AppTextVariant, string> = {
  display: 'font-display text-[40px] font-medium leading-none tracking-display text-ink',
  ceremony: 'font-display text-[24px] font-medium leading-tight tracking-display text-ink',
  voice: 'font-serif text-[19px] font-normal leading-snug text-ink',
  scrawl: 'font-serif text-[14px] italic leading-snug text-ink-3',
  heading: 'font-sans text-[18px] font-semibold leading-snug tracking-h text-ink',
  body: 'font-sans text-[14px] leading-relaxed text-ink-2',
  'body-sm': 'font-sans text-[12.5px] leading-relaxed text-ink-3',
  label: 'font-sans text-[12px] font-semibold leading-snug text-ink-3',
  overline: 'font-sans text-[11px] font-semibold uppercase tracking-overline text-ink-3',
  record: 'font-mono text-[11.5px] leading-snug text-ink-3 [font-feature-settings:"tnum"_1,"lnum"_1]',
};

const DEFAULT_ELEMENT: Record<AppTextVariant, ElementType> = {
  display: 'h1',
  ceremony: 'h2',
  voice: 'p',
  scrawl: 'span',
  heading: 'h3',
  body: 'p',
  'body-sm': 'p',
  label: 'span',
  overline: 'span',
  record: 'span',
};

export function AppText({ variant = 'body', as, className, children, ...rest }: AppTextProps) {
  const Component = as ?? DEFAULT_ELEMENT[variant];
  return (
    <Component className={cn(VARIANT_CLASSES[variant], className)} {...rest}>
      {children}
    </Component>
  );
}
