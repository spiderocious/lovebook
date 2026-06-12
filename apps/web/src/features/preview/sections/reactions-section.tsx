import { useState } from 'react';

import { ReactionButton, ReactionPicker } from '@lovebook/ui';

import { Break, ComponentRow, Section } from '../preview-canvas.tsx';

// Spec: dockito/design-system/projects/lovebook/preview/12-reactions.html + 20-moments.html
export function ReactionsSection() {
  const [picked, setPicked] = useState<string | undefined>('❤️');

  return (
    <Section
      num="12r"
      title="Reactions"
      description="One reaction per moment, replaceable, removable — the product's entire response vocabulary. There are no counts anywhere. Tap leaves the heart; long-press opens the pill of six."
    >
      <Break label="THE PICKER — LONG-PRESS ON A MOMENT (click to choose)" />
      <ComponentRow caption={`Six choices, fixed — the constraint is the charm. Selected: ${picked ?? 'none'}.`}>
        <ReactionPicker selected={picked} onSelect={setPicked} />
      </ComponentRow>

      <Break label="STATES OF THE REACTION" />
      <ComponentRow label="nothing yet · they reacted · you reacted · changing">
        <ReactionButton aria-label="React" />
        <ReactionButton emoji="🥹" />
        <ReactionButton emoji="❤️" />
        <ReactionButton emoji="❤️" changing />
      </ComponentRow>
    </Section>
  );
}
