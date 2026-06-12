import { Avatar, PairMark } from '@lovebook/ui';

import { Break, ComponentRow, Section, Swatch } from '../preview-canvas.tsx';

// Spec: dockito/design-system/projects/lovefeed/preview/23-avatars-stamps.html
export function AvatarsSection() {
  return (
    <Section
      num="23"
      title="Avatars"
      description="There are only ever two. You are filled plum; they are washed — tellable apart at 24px without reading a name. The overlapping pair mark appears in exactly two places: the pairing confirmation and the year-in-review cover."
    >
      <Break label="YOU · THEM · THE PAIR MARK" />
      <ComponentRow>
        <Swatch label="you · filled plum">
          <Avatar initial="A" who="you" size="xl" />
        </Swatch>
        <Swatch label="them · plum wash">
          <Avatar initial="T" who="them" size="xl" />
        </Swatch>
        <Swatch label="the pair mark">
          <PairMark you="A" them="T" />
        </Swatch>
      </ComponentRow>

      <Break label="SIZES — sm · md · lg · xl" />
      <ComponentRow>
        <Avatar initial="A" who="you" size="sm" />
        <Avatar initial="A" who="you" size="md" />
        <Avatar initial="A" who="you" size="lg" />
        <Avatar initial="A" who="you" size="xl" />
      </ComponentRow>
    </Section>
  );
}
