import { AppButton, EmptyState, InlineBanner, Skeleton } from '@lovebook/ui';

import { Break, ComponentRow, Section } from '../preview-canvas.tsx';

// Spec: dockito/design-system/projects/lovefeed/preview/22-feed-states.html
export function FeedStatesSection() {
  return (
    <Section
      num="22"
      title="Feed states"
      description="Empty, loading, offline, waiting — all of them kind. None are errors. The serif speaks in every one; there is no red anywhere, because red belongs to chosen destruction, not bad luck."
    >
      <Break label="LOADING — SKELETONS THAT BREATHE" />
      <ComponentRow caption="Skeletons mirror the real shapes — a polaroid frame, a postcard's two lines. Nothing spins.">
        <Skeleton kind="polaroid" />
        <Skeleton kind="postcard" />
      </ComponentRow>

      <Break label="THE EMPTY ROOMS — SERIF VOICE" />
      <ComponentRow align="start">
        <div className="w-full max-w-[300px] rounded-card border border-print-edge bg-print p-6">
          <EmptyState
            message="This is your space now. The first moment is the hardest — after that it's just life."
            note="paired today"
            action={
              <AppButton variant="secondary" size="sm">
                Drop the first moment
              </AppButton>
            }
          />
        </div>
        <div className="w-full max-w-[300px] rounded-card border border-print-edge bg-print p-6">
          <EmptyState message="Nothing new from Tobi since Tuesday." note="no pressure either way" />
        </div>
        <div className="w-full max-w-[300px] rounded-card border border-print-edge bg-print p-6">
          <EmptyState
            message="The feed didn't load. Your moments are safe — this is just the network."
            action={
              <AppButton variant="secondary" size="sm">
                Try again
              </AppButton>
            }
          />
        </div>
      </ComponentRow>

      <Break label="OFFLINE — THE INLINE AMBER STRIP" />
      <ComponentRow caption="The amber strip is the loudest offline ever gets. Cached moments stay readable beneath it.">
        <InlineBanner>Offline — showing what you have. New moments will queue.</InlineBanner>
      </ComponentRow>
    </Section>
  );
}
