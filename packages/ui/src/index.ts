// @lovebook/ui — LoveFeed "the shoebox" component library.
// Visual spec: dockito/design-system/projects/lovefeed/preview/
// Tokens:      ./styles.css (:root + .lamplight) · ./theme

// Theme
export * from './theme/index.ts';

// Utils
export { cn } from './utils/cn.ts';

// Primitives
export { AppButton } from './primitives/app-button/index.ts';
export type { AppButtonVariant, AppButtonSize, AppButtonProps } from './primitives/app-button/index.ts';
export { HoldToConfirmButton } from './primitives/hold-to-confirm-button/index.ts';
export type { HoldToConfirmButtonProps } from './primitives/hold-to-confirm-button/index.ts';
export { AppText } from './primitives/app-text/index.ts';
export type { AppTextVariant, AppTextProps } from './primitives/app-text/index.ts';
export { LineField } from './primitives/line-field/index.ts';
export type { LineFieldProps } from './primitives/line-field/index.ts';
export { ChromeField } from './primitives/chrome-field/index.ts';
export type { ChromeFieldProps } from './primitives/chrome-field/index.ts';
export { TimeField } from './primitives/time-field/index.ts';
export type { TimeFieldProps } from './primitives/time-field/index.ts';
export { InviteCodeEntry, InviteCodeDisplay } from './primitives/invite-code/index.ts';
export type {
  InviteCodeEntryProps,
  InviteCodeDisplayProps,
} from './primitives/invite-code/index.ts';
export { Switch, SettingRow } from './primitives/switch/index.ts';
export type { SwitchProps, SettingRowProps } from './primitives/switch/index.ts';

// Display
export { Avatar, PairMark } from './display/avatar/index.ts';
export type { AvatarProps, AvatarWho, AvatarSize, PairMarkProps } from './display/avatar/index.ts';
export { ReactionButton, ReactionPicker, DEFAULT_REACTIONS } from './display/reaction/index.ts';
export type { ReactionButtonProps, ReactionPickerProps } from './display/reaction/index.ts';
export { StatusPill } from './display/status-pill/index.ts';
export type { StatusPillProps, StatusTone } from './display/status-pill/index.ts';
export { Timestamp, humanizeTimestamp, exactTimestamp } from './display/timestamp/index.ts';
export type { TimestampProps } from './display/timestamp/index.ts';

// Moments — the signature display (the three things this product is)
export { PolaroidMoment, PostcardMoment, VoiceMoment } from './moments/index.ts';
export type {
  PolaroidMomentProps,
  PostcardMomentProps,
  VoiceMomentProps,
} from './moments/index.ts';

// State — the kind, serif-voiced feed states
export { Skeleton, EmptyState, InlineBanner } from './state/index.ts';
export type { SkeletonProps, EmptyStateProps, InlineBannerProps } from './state/index.ts';

// Compose — the three doors
export { ComposeBar, VoiceRecorder } from './compose/index.ts';
export type { ComposeBarProps, ComposeDoor, VoiceRecorderProps } from './compose/index.ts';

// Icons are NOT re-exported here. Import them via the dedicated proxy:
//   import { IconHome } from '@icons';
// This keeps the icon source swappable in one file.
