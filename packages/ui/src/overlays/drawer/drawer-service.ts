import type { ReactNode } from 'react';

import type { FeedbackTone } from '../feedback/feedback.tsx';
import {
  drawerStore,
  type BannerPosition,
  type ModalPosition,
  type ToastPosition,
} from './drawer-store.ts';

// Imperative service. Call from anywhere — no props, no context, no Provider.
// The host components (ToastHost, BannerHost, ModalHost) live once at the app
// root and subscribe to drawerStore via useSyncExternalStore.

interface SharedModalConfig {
  position?: ModalPosition;
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
  sticky?: boolean;
}

// ============== Toast ==============

export interface ToastOptions {
  tone?: FeedbackTone;
  durationMs?: number;
  sticky?: boolean;
  position?: ToastPosition;
  action?: { label: string; onClick: () => void };
}

function toast(message: ReactNode, opts: ToastOptions = {}): string {
  return drawerStore.pushToast({
    tone: opts.tone ?? 'default',
    message,
    durationMs: opts.durationMs ?? 3000,
    sticky: opts.sticky ?? false,
    position: opts.position ?? 'bottom-center',
    ...(opts.action ? { action: opts.action } : {}),
  });
}

function dismissToast(id: string): void {
  drawerStore.dismissToast(id);
}

// ============== Banner ==============

export interface BannerOptions {
  tone?: FeedbackTone;
  description?: ReactNode;
  icon?: ReactNode;
  cta?: { label: string; onClick: () => void };
  position?: BannerPosition;
  sticky?: boolean;
  durationMs?: number;
}

function banner(title: ReactNode, opts: BannerOptions = {}): string {
  return drawerStore.pushBanner({
    tone: opts.tone ?? 'wait',
    title,
    ...(opts.description !== undefined ? { description: opts.description } : {}),
    ...(opts.icon !== undefined ? { icon: opts.icon } : {}),
    ...(opts.cta !== undefined ? { cta: opts.cta } : {}),
    position: opts.position ?? 'top',
    sticky: opts.sticky ?? true,
    durationMs: opts.durationMs ?? 0,
  });
}

function dismissBanner(id: string): void {
  drawerStore.dismissBanner(id);
}

// ============== Confirm (standard / destructive) ==============

export interface ConfirmOptions extends SharedModalConfig {
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  children?: ReactNode;
  onCancel?: () => void;
}

function confirm(title: ReactNode, options: ConfirmOptions & { onConfirm: () => void }): void {
  const {
    onConfirm,
    description,
    confirmLabel,
    cancelLabel,
    destructive,
    children,
    onCancel,
    position,
    closeOnOutsideClick,
    closeOnEscape,
    sticky,
  } = options;
  drawerStore.openModal({
    kind: destructive === true ? 'danger' : 'standard',
    title,
    ...(description !== undefined ? { description } : {}),
    confirmLabel: confirmLabel ?? (destructive === true ? 'Hold to confirm' : 'OK'),
    ...(cancelLabel !== undefined ? { cancelLabel } : {}),
    onConfirm: () => {
      drawerStore.closeModal();
      onConfirm();
    },
    ...(onCancel !== undefined
      ? {
          onCancel: () => {
            drawerStore.closeModal();
            onCancel();
          },
        }
      : {}),
    ...(children !== undefined ? { children } : {}),
    position: position ?? 'center',
    closeOnOutsideClick: closeOnOutsideClick ?? true,
    closeOnEscape: closeOnEscape ?? true,
    sticky: sticky ?? false,
  });
}

// ============== Critical (irreversible, type-to-confirm) ==============

export interface CriticalOptions extends SharedModalConfig {
  description?: ReactNode;
  confirmLabel: string;
  confirmPhrase: string;
  confirmPrompt: ReactNode;
  cancelLabel?: string;
  children?: ReactNode;
  onCancel?: () => void;
}

function critical(title: ReactNode, options: CriticalOptions & { onConfirm: () => void }): void {
  const {
    onConfirm,
    description,
    confirmPhrase,
    confirmPrompt,
    confirmLabel,
    cancelLabel,
    children,
    onCancel,
    position,
    closeOnOutsideClick,
    closeOnEscape,
    sticky,
  } = options;
  drawerStore.openModal({
    kind: 'critical',
    title,
    ...(description !== undefined ? { description } : {}),
    confirmPhrase,
    confirmPrompt,
    confirmLabel,
    ...(cancelLabel !== undefined ? { cancelLabel } : {}),
    onConfirm: () => {
      drawerStore.closeModal();
      onConfirm();
    },
    ...(onCancel !== undefined
      ? {
          onCancel: () => {
            drawerStore.closeModal();
            onCancel();
          },
        }
      : {}),
    ...(children !== undefined ? { children } : {}),
    position: position ?? 'center',
    closeOnOutsideClick: closeOnOutsideClick ?? false, // safer default for critical
    closeOnEscape: closeOnEscape ?? true,
    sticky: sticky ?? false,
  });
}

// ============== Custom modal (arbitrary body — half-sheets, side drawers) ==============

export interface CustomModalOptions extends SharedModalConfig {
  hideCloseButton?: boolean;
  onClose?: () => void;
}

function openModal(body: ReactNode, options: CustomModalOptions = {}): void {
  const { onClose, hideCloseButton, position, closeOnOutsideClick, closeOnEscape, sticky } = options;
  drawerStore.openModal({
    kind: 'custom',
    body,
    hideCloseButton: hideCloseButton ?? false,
    ...(onClose !== undefined
      ? {
          onCancel: () => {
            drawerStore.closeModal();
            onClose();
          },
        }
      : {}),
    position: position ?? 'center',
    closeOnOutsideClick: closeOnOutsideClick ?? true,
    closeOnEscape: closeOnEscape ?? true,
    sticky: sticky ?? false,
  });
}

function closeModal(): void {
  drawerStore.closeModal();
}

/**
 * DrawerService — imperative toast + banner + modal singleton.
 *
 * Mount <ToastHost />, <BannerHost />, and <ModalHost /> once at the app root,
 * then call from anywhere:
 *
 *   DrawerService.toast('Sent to Tobi', { tone: 'ok' });
 *   DrawerService.toast('Moment sent', { action: { label: 'Undo', onClick: () => {} } });
 *   DrawerService.banner('Your invite expires in 2 hours.', { cta: { label: 'Resend', onClick: () => {} } });
 *   DrawerService.confirm('Replace your reaction?', { onConfirm: () => {} });
 *   DrawerService.confirm('Leave your pair with Tobi?', { destructive: true, onConfirm: () => {} });
 *   DrawerService.critical('Delete your account?', {
 *     confirmPhrase: 'DELETE',
 *     confirmPrompt: <>Type <strong>DELETE</strong> to continue</>,
 *     confirmLabel: 'Delete forever',
 *     onConfirm: () => {},
 *   });
 *   DrawerService.openModal(<HalfSheetBody />, { position: 'bottom' });
 */
export const DrawerService = {
  toast,
  dismissToast,
  banner,
  dismissBanner,
  confirm,
  critical,
  openModal,
  closeModal,
};
