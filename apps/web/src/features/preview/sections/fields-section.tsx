import { useState } from 'react';

import { AppButton, ChromeField, LineField, TimeField } from '@lovebook/ui';

import { Break, ComponentRow, Section } from '../preview-canvas.tsx';

// Spec: dockito/design-system/projects/lovebook/preview/11-inputs.html
export function FieldsSection() {
  const [note, setNote] = useState('The jollof place finally reopened.');
  const [from, setFrom] = useState('22:30');
  const [until, setUntil] = useState('07:00');

  return (
    <Section
      num="11"
      title="Fields"
      description="A field is a bare line on the paper, not a box. The composer (serif, the product's own input) comes first; chrome fields (auth, profile) come last and stay small; times are mono pills."
    >
      <Break label="THE COMPOSER — A TEXT MOMENT (try typing)" />
      <ComponentRow caption="Serif, 20px. The counter ambers at the limit and input simply stops — 200 characters is the form, like a postcard's edge.">
        <div className="flex w-full max-w-[440px] items-end gap-4">
          <LineField
            value={note}
            onValueChange={setNote}
            maxLength={200}
            showCounter
            aria-label="Write a note"
          />
          <AppButton variant="primary" size="sm">
            Send
          </AppButton>
        </div>
      </ComponentRow>

      <Break label="QUIET HOURS — MONO TIME PILLS (editable)" />
      <ComponentRow caption="Times are mono pills — the record idiom. The controls stay wordless.">
        <TimeField value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From" />
        <span className="text-[13px] text-ink-3">until</span>
        <TimeField value={until} onChange={(e) => setUntil(e.target.value)} aria-label="Until" />
      </ComponentRow>

      <Break label="CHROME FIELDS — AUTH & PROFILE, QUIET AND LAST" />
      <ComponentRow align="start">
        <div className="flex w-full max-w-[320px] flex-col gap-5">
          <ChromeField label="Email" type="email" defaultValue="ada@example.com" id="pf-email" />
          <ChromeField label="Password" type="password" defaultValue="password123" id="pf-pass" />
          <ChromeField label="Display name" defaultValue="Adaeze" id="pf-name" />
        </div>
      </ComponentRow>
    </Section>
  );
}
