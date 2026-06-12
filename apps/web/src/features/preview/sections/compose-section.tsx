import { useState } from 'react';

import { AppButton, ComposeBar, type ComposeDoor, LineField, VoiceRecorder } from '@lovebook/ui';

import { Break, ComponentRow, Section } from '../preview-canvas.tsx';

// Spec: dockito/design-system/projects/lovebook/preview/21-compose.html
const LIVE_WAVE = [0.35, 0.6, 0.8, 0.45, 0.9, 0.55, 0.7, 0.4, 0.85, 0.5, 0.65, 0.38];

export function ComposeSection() {
  const [active, setActive] = useState<ComposeDoor>('photo');
  const [note, setNote] = useState('Sky was unreasonable this evening.');

  return (
    <Section
      num="21"
      title="Compose"
      description="Three doors, 3–5 seconds each — the bar, the camera, the mic. The bar never moves; the three doors are always named so a first-time parent never has to guess an icon."
    >
      <Break label="THE BAR — RESTING & ACTIVE (click a door)" />
      <ComponentRow caption={`Active door: ${active}.`}>
        <ComposeBar active={active} onCompose={setActive} />
      </ComponentRow>

      <Break label="THE THREE FLOWS" />
      <ComponentRow align="start">
        <div className="w-full max-w-[260px] rounded-card border border-print-edge bg-print p-6">
          <div className="mb-4 font-sans text-[11px] font-semibold uppercase tracking-overline text-ink-3">
            Photo · preview
          </div>
          <div
            className="aspect-[3/4] overflow-hidden rounded-[10px]"
            style={{ background: 'linear-gradient(180deg, #C9A5B4 0%, #E2B59B 38%, #E8C9A1 58%, #8F8AA8 100%)' }}
          />
          <div className="mt-4 flex justify-between">
            <AppButton variant="quiet" size="sm">
              Retake
            </AppButton>
            <AppButton variant="primary" size="sm">
              Send to Ada
            </AppButton>
          </div>
        </div>

        <div className="w-full max-w-[260px] rounded-card border border-print-edge bg-print p-6">
          <div className="mb-4 font-sans text-[11px] font-semibold uppercase tracking-overline text-ink-3">
            Voice · holding to record
          </div>
          <VoiceRecorder seconds={11} waveform={LIVE_WAVE} recording />
        </div>

        <div className="w-full max-w-[260px] rounded-card border border-print-edge bg-print p-6">
          <div className="mb-4 font-sans text-[11px] font-semibold uppercase tracking-overline text-ink-3">
            Note · writing
          </div>
          <LineField value={note} onValueChange={setNote} maxLength={200} showCounter aria-label="Note" />
        </div>
      </ComponentRow>
    </Section>
  );
}
