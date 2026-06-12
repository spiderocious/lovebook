import type { Config } from 'tailwindcss';

import { loveBookPreset } from '@lovebook/ui/tailwind-preset';

// Shares the lovebook shoebox theme so @lovebook/ui components render the same
// here as in the web app. Source of truth:
// dockito/design-system/projects/lovebook/preview/_foundation.css
export default {
  presets: [loveBookPreset],
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  plugins: [],
} satisfies Config;
