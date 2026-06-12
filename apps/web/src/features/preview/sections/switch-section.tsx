import { useState } from 'react';

import { SettingRow, Switch } from '@lovebook/ui';

import { Break, ComponentRow, Section } from '../preview-canvas.tsx';

// Spec: dockito/design-system/projects/lovebook/preview/12-reactions.html (switches)
export function SwitchSection() {
  const [notifications, setNotifications] = useState(true);
  const [quiet, setQuiet] = useState(true);
  const [lampFollows, setLampFollows] = useState(false);

  return (
    <Section
      num="12"
      title="Switch"
      description="The product's only selection control. No checkboxes, no radio groups, no dropdowns in v1 — the product has so few choices that the switch covers all of them. That absence is a design decision."
    >
      <Break label="IN A SETTINGS ROW" />
      <ComponentRow>
        <div className="w-full max-w-[520px]">
          <SettingRow
            title="Notifications"
            description="‘Ada dropped a moment’ — never the content itself."
            control={
              <Switch
                checked={notifications}
                onCheckedChange={setNotifications}
                aria-label="Notifications"
              />
            }
          />
          <SettingRow
            title="Quiet hours"
            description="22:30 – 07:00 · held until morning"
            control={<Switch checked={quiet} onCheckedChange={setQuiet} aria-label="Quiet hours" />}
          />
          <SettingRow
            title="Lamplight follows sunset"
            description="The room dims by itself in the evening."
            control={
              <Switch
                checked={lampFollows}
                onCheckedChange={setLampFollows}
                aria-label="Lamplight follows sunset"
              />
            }
          />
        </div>
      </ComponentRow>

      <Break label="STATES" />
      <ComponentRow label="on · off · disabled">
        <Switch checked onCheckedChange={() => {}} aria-label="On" />
        <Switch checked={false} onCheckedChange={() => {}} aria-label="Off" />
        <Switch checked disabled onCheckedChange={() => {}} aria-label="Disabled on" />
        <Switch checked={false} disabled onCheckedChange={() => {}} aria-label="Disabled off" />
      </ComponentRow>
    </Section>
  );
}
