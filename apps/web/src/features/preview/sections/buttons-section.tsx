import { AppButton, HoldToConfirmButton } from '@lovebook/ui';

import { Break, ComponentRow, Section } from '../preview-canvas.tsx';

// Spec: dockito/design-system/projects/lovebook/preview/10-buttons.html
export function ButtonsSection() {
  return (
    <Section
      num="10"
      title="Buttons"
      description="Four weights. Filled plum for the one thing the screen wants; plum wash for the alternative; quiet for ‘not now’; the crimson wash that only guards the two irreversible doors. The crimson door is held, never tapped."
    >
      <Break label="SCENE — SENDING A PHOTO" />
      <ComponentRow caption="The preview foot. Send names the person — the button reminds you it's not a broadcast.">
        <AppButton variant="quiet">Retake</AppButton>
        <AppButton variant="primary">Send to Ada</AppButton>
      </ComponentRow>

      <ComponentRow
        label="The pairing fork — the only screen with two large buttons"
        align="start"
      >
        <div className="flex w-full max-w-[280px] flex-col gap-2.5">
          <AppButton variant="primary" size="lg" className="w-full">
            Invite someone
          </AppButton>
          <AppButton variant="secondary" size="lg" className="w-full">
            Enter an invite code
          </AppButton>
        </div>
      </ComponentRow>

      <Break label="THE CRIMSON DOOR — HELD, NOT TAPPED" />
      <ComponentRow caption="Press and hold for 1.2s — crimson fills the pill, then commits. Releasing early cancels. ‘Stay’ is deliberately the word, not ‘Cancel’.">
        <AppButton variant="quiet">Stay</AppButton>
        <HoldToConfirmButton
          onConfirm={() => {
            /* demo only */
          }}
          confirmingLabel="Leaving…"
        />
      </ComponentRow>

      <Break label="REFERENCE — THE FOUR WEIGHTS × THREE SIZES" />
      <ComponentRow label="primary">
        <AppButton variant="primary" size="sm">
          Send
        </AppButton>
        <AppButton variant="primary">Send</AppButton>
        <AppButton variant="primary" size="lg">
          Send
        </AppButton>
        <AppButton variant="primary" loading>
          Send
        </AppButton>
        <AppButton variant="primary" disabled>
          Send
        </AppButton>
      </ComponentRow>
      <ComponentRow label="secondary">
        <AppButton variant="secondary" size="sm">
          Retake
        </AppButton>
        <AppButton variant="secondary">Retake</AppButton>
        <AppButton variant="secondary" disabled>
          Retake
        </AppButton>
      </ComponentRow>
      <ComponentRow label="quiet">
        <AppButton variant="quiet" size="sm">
          Not now
        </AppButton>
        <AppButton variant="quiet">Not now</AppButton>
        <AppButton variant="quiet" disabled>
          Not now
        </AppButton>
      </ComponentRow>
      <ComponentRow label="danger — the crimson wash (resting state of the door)">
        <AppButton variant="danger" size="sm">
          Leave pair
        </AppButton>
        <AppButton variant="danger">Leave pair</AppButton>
        <AppButton variant="danger" disabled>
          Leave pair
        </AppButton>
      </ComponentRow>
    </Section>
  );
}
