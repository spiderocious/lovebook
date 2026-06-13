import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

// Self-hosted fonts — the lovebook voice. Serif is the human voice, Fraunces is
// ceremony (covers/headlines), Inter is chrome, JetBrains Mono is the record.
import '@fontsource/source-serif-4/400.css';
import '@fontsource/source-serif-4/500.css';
import '@fontsource/source-serif-4/600.css';
import '@fontsource/source-serif-4/400-italic.css';
import '@fontsource/fraunces/400.css';
import '@fontsource/fraunces/500.css';
import '@fontsource/fraunces/600.css';
import '@fontsource/fraunces/400-italic.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';

// The shoebox design tokens (:root CSS variables the Tailwind preset maps to).
// Without this, every var(--paper)/var(--plum) class resolves to nothing.
import '@lovebook/ui/styles.css';
import './globals.css';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://lovebook.app';

export const metadata: Metadata = {
  title: 'lovebook — one feed, two people',
  description:
    'A two-person ambient feed. Post a moment, your person sees it. No replies, no metrics, just presence.',
  metadataBase: new URL(APP_URL),
  openGraph: {
    title: 'lovebook — one feed, two people',
    description: 'Post a moment, your person sees it. No replies, no metrics, just presence.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#6e455e',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
