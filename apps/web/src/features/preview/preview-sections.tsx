import { type ReactNode } from 'react';

import { type PreviewNavItem } from './preview-canvas.tsx';

// The preview registry. Every component, the moment it is built, registers one
// entry here (a nav item + the section JSX). The screen renders this array in
// order — so "component built" and "component visible in the preview" stay one
// indivisible unit of work. Add new specimens by importing their section and
// pushing an entry; never batch.

export interface PreviewSection extends PreviewNavItem {
  readonly render: () => ReactNode;
}

import { ButtonsSection } from './sections/buttons-section.tsx';
import { TextSection } from './sections/text-section.tsx';
import { FieldsSection } from './sections/fields-section.tsx';
import { InviteSection } from './sections/invite-section.tsx';
import { SwitchSection } from './sections/switch-section.tsx';

export const PREVIEW_SECTIONS: ReadonlyArray<PreviewSection> = [
  { id: '10', label: 'Buttons', group: 'Primitives', render: () => <ButtonsSection /> },
  { id: '02', label: 'Text', group: 'Primitives', render: () => <TextSection /> },
  { id: '11', label: 'Fields', group: 'Primitives', render: () => <FieldsSection /> },
  { id: '11b', label: 'Invite code', group: 'Primitives', render: () => <InviteSection /> },
  { id: '12', label: 'Switch', group: 'Primitives', render: () => <SwitchSection /> },
];
