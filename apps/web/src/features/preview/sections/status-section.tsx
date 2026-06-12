import { StatusPill, Timestamp } from '@lovebook/ui';

import { Break, ComponentRow, Section } from '../preview-canvas.tsx';

// Spec: dockito/design-system/projects/lovefeed/preview/23-avatars-stamps.html
const HOUR = 3_600_000;
const DAY = 86_400_000;
const NOW = new Date('2026-06-12T21:47:00');

export function StatusSection() {
  return (
    <Section
      num="23s"
      title="Status & time"
      description="Five statuses run the entire product, and times are written the way you'd say them across a kitchen table. The dot never animates; the exact mono record hides behind a tap. No ‘seen’, no ‘typing’, no ‘active 2h ago’ — the absence is the feature."
    >
      <Break label="THE FULL STATUS TAXONOMY — ALL FIVE OF THEM" />
      <ComponentRow caption="‘Pair dissolved’ is the only crimson pill and appears once, in the archive.">
        <StatusPill tone="ok">Connected</StatusPill>
        <StatusPill tone="ok">Delivered</StatusPill>
        <StatusPill tone="wait">Queued</StatusPill>
        <StatusPill tone="wait">Code expiring</StatusPill>
        <StatusPill tone="crit">Pair dissolved</StatusPill>
      </ComponentRow>
      <ComponentRow label="dot-only — for the top bar">
        <StatusPill tone="ok" dotOnly />
        <StatusPill tone="wait" dotOnly />
      </ComponentRow>

      <Break label="TIMESTAMPS — HUMAN FIRST, EXACT ON TAP" />
      <ComponentRow
        caption="Tap any timestamp to reveal the exact mono record, then tap again to hide it."
        align="start"
      >
        <div className="flex flex-col items-start gap-2">
          <Timestamp date={new Date(NOW.getTime() - 30_000)} now={NOW} />
          <Timestamp date={new Date(NOW.getTime() - 2 * HOUR)} now={NOW} />
          <Timestamp date={new Date(NOW.getTime() - 1 * DAY)} now={NOW} />
          <Timestamp date={new Date(NOW.getTime() - 4 * DAY)} now={NOW} />
          <Timestamp date={new Date('2026-03-14T10:00:00')} now={NOW} />
          <Timestamp date={new Date('2025-03-14T10:00:00')} now={NOW} />
        </div>
      </ComponentRow>
    </Section>
  );
}
