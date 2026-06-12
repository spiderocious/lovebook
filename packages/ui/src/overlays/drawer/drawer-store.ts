import type { ReactNode } from 'react';

import type { FeedbackTone } from '../feedback/feedback.tsx';

// The drawer store backs the imperative DrawerService. It tracks three queues:
//
//   toasts  — auto-dismissing ink slips (or sticky ones) in any of 6 zones
//   banners — the persistent amber strips at top or bottom (they don't stack)
//   modal   — at most one open modal (standard / danger / critical / custom)
//
// Subscription is a tiny pub-sub so React's useSyncExternalStore (in the host
// components) stays in sync with zero framework dependency.

// ============== Toast ==============

export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface ToastEntry {
  id: string;
  tone: FeedbackTone;
  message: ReactNode;
  action?: { label: string; onClick: () => void };
  durationMs: number;
  sticky: boolean;
  position: ToastPosition;
}

// ============== Modal ==============

export type ModalPosition = 'center' | 'top' | 'bottom' | 'left' | 'right';

interface ModalEntryBase {
  position: ModalPosition;
  closeOnOutsideClick: boolean;
  closeOnEscape: boolean;
  sticky: boolean;
  onCancel?: () => void;
  children?: ReactNode;
}

export interface StandardModalEntry extends ModalEntryBase {
  kind: 'standard' | 'danger';
  title: ReactNode;
  description?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
}

export interface CriticalModalEntry extends ModalEntryBase {
  kind: 'critical';
  title: ReactNode;
  description?: ReactNode;
  confirmPhrase: string;
  confirmPrompt: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
}

export interface CustomModalEntry extends ModalEntryBase {
  kind: 'custom';
  body: ReactNode;
  hideCloseButton: boolean;
}

export type ModalEntry = StandardModalEntry | CriticalModalEntry | CustomModalEntry;

// ============== Banner ==============

export type BannerPosition = 'top' | 'bottom';

export interface BannerEntry {
  id: string;
  tone: FeedbackTone;
  title: ReactNode;
  description?: ReactNode;
  cta?: { label: string; onClick: () => void };
  icon?: ReactNode;
  position: BannerPosition;
  sticky: boolean;
  durationMs: number;
}

// ============== Store ==============

interface DrawerState {
  toasts: readonly ToastEntry[];
  banners: readonly BannerEntry[];
  modal: ModalEntry | null;
}

type Listener = () => void;

class DrawerStore {
  private state: DrawerState = { toasts: [], banners: [], modal: null };
  private listeners = new Set<Listener>();
  private nextId = 0;

  getState = (): DrawerState => this.state;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private emit() {
    this.listeners.forEach((l) => l());
  }

  private set(next: Partial<DrawerState>) {
    this.state = { ...this.state, ...next };
    this.emit();
  }

  // ----- Toasts -----
  pushToast = (entry: Omit<ToastEntry, 'id'>): string => {
    const id = `t-${this.nextId++}`;
    this.set({ toasts: [...this.state.toasts, { id, ...entry }] });
    if (!entry.sticky && entry.durationMs > 0) {
      setTimeout(() => this.dismissToast(id), entry.durationMs);
    }
    return id;
  };

  dismissToast = (id: string): void => {
    this.set({ toasts: this.state.toasts.filter((t) => t.id !== id) });
  };

  // ----- Banners (never stack: a new one replaces the queue) -----
  pushBanner = (entry: Omit<BannerEntry, 'id'>): string => {
    const id = `b-${this.nextId++}`;
    this.set({ banners: [{ id, ...entry }] });
    if (!entry.sticky && entry.durationMs > 0) {
      setTimeout(() => this.dismissBanner(id), entry.durationMs);
    }
    return id;
  };

  dismissBanner = (id: string): void => {
    this.set({ banners: this.state.banners.filter((b) => b.id !== id) });
  };

  // ----- Modal -----
  openModal = (entry: ModalEntry): void => {
    this.set({ modal: entry });
  };

  closeModal = (): void => {
    this.set({ modal: null });
  };
}

export const drawerStore = new DrawerStore();
