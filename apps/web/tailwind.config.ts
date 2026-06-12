import type { Config } from 'tailwindcss';

import { loveBookPreset } from '@lovebook/ui/tailwind-preset';

// lovebook — "the shoebox". Theme lives in the shared preset (CSS-var driven,
// so a single class works in both light and Lamplight). Source of truth:
// dockito/design-system/projects/lovebook/preview/_foundation.css
export default {
  presets: [loveBookPreset],
  content: ['./index.html', './src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  plugins: [],
} satisfies Config;
