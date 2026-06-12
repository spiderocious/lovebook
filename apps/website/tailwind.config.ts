import type { Config } from 'tailwindcss';

import { lovefeedPreset } from '@lovebook/ui/tailwind-preset';

// Shares the LoveFeed shoebox theme so @lovebook/ui components render the same
// here as in the web app. Source of truth:
// dockito/design-system/projects/lovefeed/preview/_foundation.css
export default {
  presets: [lovefeedPreset],
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  plugins: [],
} satisfies Config;
