import type { Config } from 'tailwindcss';

import { lovefeedPreset } from '@lovebook/ui/tailwind-preset';

// LoveFeed — "the shoebox". Theme lives in the shared preset (CSS-var driven,
// so a single class works in both light and Lamplight). Source of truth:
// dockito/design-system/projects/lovefeed/preview/_foundation.css
export default {
  presets: [lovefeedPreset],
  content: ['./index.html', './src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  plugins: [],
} satisfies Config;
