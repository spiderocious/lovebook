import { AppButton, PolaroidMoment, PostcardMoment, ReactionButton, VoiceMoment } from '@lovebook/ui';

import { Break, ComponentRow, Section } from '../preview-canvas.tsx';

// Spec: dockito/design-system/projects/lovefeed/preview/20-moments.html
const SKY = 'linear-gradient(180deg, #C9A5B4 0%, #E2B59B 38%, #E8C9A1 58%, #8F8AA8 100%)';
const MARKET = 'linear-gradient(160deg, #B7793F 0%, #D9A45C 45%, #8C5B33 100%)';
const DOG = 'linear-gradient(145deg, #C8A87E 0%, #9C7B52 60%, #6E5436 100%)';

const WAVE = [0.3, 0.64, 0.42, 0.88, 0.55, 0.7, 0.38, 0.92, 0.33, 0.58, 0.47, 0.76, 0.31, 0.52, 0.4, 0.66];

export function MomentsSection() {
  return (
    <Section
      num="20"
      title="Moments"
      description="The signature display. Each post type is a different kept object: photos are tilted polaroids, text is a postcard, voice is a quiet card. No captions exist — the PRD forbids them, and the design agrees."
    >
      <Break label="THE THREE" />
      <ComponentRow align="start">
        <PolaroidMoment
          author="Tobi"
          timestamp="2h ago"
          tilt="left"
          fallbackBackground={SKY}
          reaction={<ReactionButton emoji="🥹" />}
        />
        <PostcardMoment
          text="The jollof place finally reopened. I ordered for two out of habit."
          timestamp="this afternoon"
          tilt="right"
          reaction={<ReactionButton aria-label="React" />}
        />
        <VoiceMoment
          waveform={WAVE}
          progress={0.35}
          duration="0:18"
          author="Ada"
          timestamp="this morning"
          reaction={<ReactionButton emoji="❤️" />}
        />
      </ComponentRow>

      <Break label="WHOSE IS WHOSE — WITHOUT BUBBLES" />
      <ComponentRow caption="Both people's moments sit in one full-width column — a shared box, not a conversation. Your own moments say ‘you’, never your display name." align="start">
        <PolaroidMoment
          author="Ada"
          timestamp="this morning"
          tilt="left"
          fallbackBackground={MARKET}
          reaction={<ReactionButton aria-label="React" />}
        />
        <PolaroidMoment
          author="you"
          timestamp="just now · delivered"
          tilt="right"
          fallbackBackground={DOG}
          reaction={<ReactionButton aria-label="React" />}
        />
      </ComponentRow>

      <Break label="EDGE STATES OF A MOMENT" />
      <ComponentRow align="start">
        <VoiceMoment
          waveform={WAVE.slice(0, 10)}
          duration="0:11"
          queued={
            <span className="font-sans text-[12px] text-wait">Queued · will send when online</span>
          }
        />
        <PolaroidMoment author="Tobi" timestamp="2h ago" tilt="left" loading reaction={<ReactionButton aria-label="React" />} />
        <PostcardMoment
          failed
          timestamp="last Tuesday"
          retry={
            <AppButton variant="quiet" size="sm">
              Try again
            </AppButton>
          }
        />
      </ComponentRow>
    </Section>
  );
}
