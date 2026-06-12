import { AppText } from '@lovebook/ui';

import { Break, ComponentRow, Section } from '../preview-canvas.tsx';

// Spec: dockito/design-system/projects/lovebook/preview/02-type.html
export function TextSection() {
  return (
    <Section
      num="02"
      title="Text"
      description="The serif belongs to humans. The voice/scrawl variants (Source Serif) carry anything a person wrote or said and the empty-room states; the machine speaks in Inter; the record is JetBrains Mono; Fraunces is ceremony only."
    >
      <Break label="THE HUMAN VOICE — SOURCE SERIF" />
      <ComponentRow caption="‘voice’ is a person speaking; ‘scrawl’ is the pencil note on the back of a print.">
        <div className="flex flex-col gap-3">
          <AppText variant="voice">The jollof place finally reopened. I ordered for two out of habit.</AppText>
          <AppText variant="scrawl">Tobi · 2h ago</AppText>
        </div>
      </ComponentRow>

      <Break label="CEREMONY — FRAUNCES, RARE" />
      <ComponentRow caption="Covers and the year-in-review only.">
        <div className="flex flex-col gap-2">
          <AppText variant="display">412 moments</AppText>
          <AppText variant="ceremony">One feed, two people.</AppText>
        </div>
      </ComponentRow>

      <Break label="CHROME — INTER" />
      <ComponentRow>
        <div className="flex flex-col gap-2">
          <AppText variant="heading">Quiet hours</AppText>
          <AppText variant="body">Notifications wait, then deliver when the window opens.</AppText>
          <AppText variant="body-sm">Seen by exactly one person.</AppText>
          <AppText variant="label">Display name</AppText>
          <AppText variant="overline">Settings · You</AppText>
        </div>
      </ComponentRow>

      <Break label="THE RECORD — JETBRAINS MONO" />
      <ComponentRow caption="Codes, counts, durations, exact timestamps.">
        <AppText variant="record">QF7-K2M</AppText>
        <AppText variant="record">0:18</AppText>
        <AppText variant="record">2026-06-12 · 21:47</AppText>
      </ComponentRow>
    </Section>
  );
}
