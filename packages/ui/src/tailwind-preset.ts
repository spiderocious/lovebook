// Shared Tailwind theme for LoveFeed — "the shoebox".
// Colours are CSS variables (defined in packages/ui/src/styles.css, with a
// `.lamplight` dark override), so a single class works in both light and
// Lamplight without per-component branching. Each app spreads this preset:
//
//   import { lovefeedPreset } from '@lovebook/ui/tailwind-preset';
//   export default { presets: [lovefeedPreset], content: [...] } satisfies Config;
//
// Source of truth: dockito/design-system/projects/lovefeed/preview/_foundation.css
export const lovefeedPreset = {
  theme: {
    extend: {
      colors: {
        paper: 'var(--paper)',
        'paper-deep': 'var(--paper-deep)',
        print: 'var(--print)',
        'print-edge': 'var(--print-edge)',
        ink: 'var(--ink)',
        'ink-2': 'var(--ink-2)',
        'ink-3': 'var(--ink-3)',
        'ink-4': 'var(--ink-4)',
        hair: 'var(--hair)',
        'hair-strong': 'var(--hair-strong)',
        plum: 'var(--plum)',
        'plum-deep': 'var(--plum-deep)',
        'plum-soft': 'var(--plum-soft)',
        'plum-wash': 'var(--plum-wash)',
        'plum-wash-2': 'var(--plum-wash-2)',
        crit: 'var(--crit)',
        'crit-bg': 'var(--crit-bg)',
        'crit-edge': 'var(--crit-edge)',
        wait: 'var(--wait)',
        'wait-bg': 'var(--wait-bg)',
        'wait-edge': 'var(--wait-edge)',
        ok: 'var(--ok)',
        'ok-bg': 'var(--ok-bg)',
        'ok-edge': 'var(--ok-edge)',
      },
      fontFamily: {
        // The human voice / chrome / record / ceremony.
        serif: ['Source Serif 4', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
        display: ['Fraunces', 'Source Serif 4', 'serif'],
      },
      letterSpacing: {
        display: '-0.022em',
        h: '-0.01em',
        label: '0.01em',
        overline: '0.18em',
      },
      borderRadius: {
        pill: '9999px',
        print: '4px',
        card: '14px',
        bar: '9999px',
      },
      boxShadow: {
        keepsake: 'var(--shade-keepsake)',
        float: 'var(--shade-float)',
      },
      transitionTimingFunction: {
        settle: 'cubic-bezier(0.22, 0.8, 0.36, 1)',
      },
      keyframes: {
        settle: {
          from: { opacity: '0', transform: 'translateY(-10px) rotate(0.6deg)' },
          to: { opacity: '1', transform: 'translateY(0) rotate(0deg)' },
        },
        breathe: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
      },
      animation: {
        settle: 'settle 260ms cubic-bezier(0.22, 0.8, 0.36, 1) both',
        breathe: 'breathe 1.8s ease-in-out infinite',
      },
    },
  },
};
