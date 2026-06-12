import Link from 'next/link';

import { AppText } from '@lovebook/ui';

export default function HomePage() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:5173';

  return (
    <main className="mx-auto max-w-4xl px-6 py-20">
      <AppText variant="overline">marketing site</AppText>
      <AppText variant="display" className="mt-2 text-ink">
        Your product headline goes here.
      </AppText>
      <AppText variant="body" className="mt-6 max-w-2xl">
        This is the Next.js marketing site in the monorepo template. It shares the
        same UI primitives as the app. Replace this copy, the cards below and the
        metadata in layout.tsx with your own.
      </AppText>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href={appUrl}
          className="inline-flex items-center justify-center rounded-pill bg-plum px-5 py-2.5 text-sm font-medium text-print hover:bg-plum-deep"
        >
          Open the app
        </Link>
        <Link
          href="/pricing"
          className="inline-flex items-center justify-center rounded-pill border border-hair-strong px-5 py-2.5 text-sm font-medium text-plum hover:bg-plum-wash"
        >
          Pricing
        </Link>
      </div>

      <section className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Card title="Feature one" body="Describe your first feature here." />
        <Card title="Feature two" body="Describe your second feature here." />
        <Card title="Feature three" body="Describe your third feature here." />
        <Card title="Feature four" body="Describe your fourth feature here." />
      </section>
    </main>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-card border border-print-edge bg-print p-5">
      <AppText variant="heading" className="text-ink">
        {title}
      </AppText>
      <AppText variant="body-sm" className="mt-2">
        {body}
      </AppText>
    </div>
  );
}
