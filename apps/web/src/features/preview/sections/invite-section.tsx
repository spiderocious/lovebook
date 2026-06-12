import { useState } from 'react';

import { InviteCodeDisplay, InviteCodeEntry } from '@lovebook/ui';

import { Break, ComponentRow, Section } from '../preview-canvas.tsx';

// Spec: dockito/design-system/projects/lovefeed/preview/11-inputs.html (the invite code, both sides)
export function InviteSection() {
  const [code, setCode] = useState('QF7K2');
  const [done, setDone] = useState(false);

  return (
    <Section
      num="11b"
      title="Invite code"
      description="Both sides of the one handshake. The inviter sees a huge mono display they can copy; the receiver types into six real cells — each character an object they were handed."
    >
      <Break label="YOUR INVITE — DISPLAY, NOT INPUT" />
      <ComponentRow caption="Mono, huge, unmistakable. Copy uses meemaw's CopyToClipboard for the confirmation state.">
        <InviteCodeDisplay
          code="QF7-K2M"
          copyText="https://lovefeed.app/join/QF7-K2M"
          expiryLabel="expires in 23 h 41 m"
        />
      </ComponentRow>

      <Break label="ENTER YOUR CODE — A REAL INPUT (try typing or pasting)" />
      <ComponentRow caption={done ? 'Complete — onComplete fired.' : 'Six cells, one focusable input. Mobile gets the right keyboard; paste fills all six.'}>
        <InviteCodeEntry
          value={code}
          onChange={(v) => {
            setCode(v);
            setDone(false);
          }}
          onComplete={() => setDone(true)}
        />
      </ComponentRow>
    </Section>
  );
}
