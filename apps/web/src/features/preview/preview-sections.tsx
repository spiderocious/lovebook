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
import { AvatarsSection } from './sections/avatars-section.tsx';
import { ReactionsSection } from './sections/reactions-section.tsx';
import { StatusSection } from './sections/status-section.tsx';
import { MomentsSection } from './sections/moments-section.tsx';
import { FeedStatesSection } from './sections/feed-states-section.tsx';
import { ComposeSection } from './sections/compose-section.tsx';

export const PREVIEW_SECTIONS: ReadonlyArray<PreviewSection> = [
  { id: '10', label: 'Buttons', group: 'Primitives', render: () => <ButtonsSection /> },
  { id: '02', label: 'Text', group: 'Primitives', render: () => <TextSection /> },
  { id: '11', label: 'Fields', group: 'Primitives', render: () => <FieldsSection /> },
  { id: '11b', label: 'Invite code', group: 'Primitives', render: () => <InviteSection /> },
  { id: '12', label: 'Switch', group: 'Primitives', render: () => <SwitchSection /> },
  { id: '23', label: 'Avatars', group: 'Display', render: () => <AvatarsSection /> },
  { id: '12r', label: 'Reactions', group: 'Display', render: () => <ReactionsSection /> },
  { id: '23s', label: 'Status & time', group: 'Display', render: () => <StatusSection /> },
  { id: '20', label: 'Moments', group: 'Domain', render: () => <MomentsSection /> },
  { id: '22', label: 'Feed states', group: 'Domain', render: () => <FeedStatesSection /> },
  { id: '21', label: 'Compose', group: 'Domain', render: () => <ComposeSection /> },
];
