import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

import { AppButton } from '../../primitives/app-button/app-button.tsx';
import { HoldToConfirmButton } from '../../primitives/hold-to-confirm-button/hold-to-confirm-button.tsx';
import { cn } from '../../utils/cn.ts';

/**
 * Modal primitives — the two heavy doors and the light sheets.
 *
 * Visual spec: dockito/design-system/projects/lovefeed/preview/40-modals.html
 * Tokens:      _foundation.css (.modal, .crit-rule, .backdrop)
 *
 * The product interrupts for almost nothing. Each speaks in the serif, because
 * the system is talking about the relationship, not about data. `danger` uses
 * hold-to-confirm (leave pair); `CriticalModal` uses typed-confirm (delete
 * account); both wear the crimson rule across the head — the only place it
 * exists. `Stay` is deliberately the cancel word, not `Cancel`.
 */
export type ModalPosition = 'center' | 'top' | 'bottom' | 'left' | 'right';

interface ScrimProps {
  position: ModalPosition;
  closeOnOutsideClick: boolean;
  closeOnEscape: boolean;
  sticky: boolean;
  onClose: () => void;
  children: ReactNode;
}

const POSITION_WRAP: Record<ModalPosition, string> = {
  center: 'items-center justify-center p-6',
  top: 'items-start justify-center p-6',
  bottom: 'items-end justify-center',
  left: 'items-stretch justify-start',
  right: 'items-stretch justify-end',
};

const POSITION_PANEL: Record<ModalPosition, string> = {
  center: 'w-full max-w-[360px] rounded-card',
  top: 'w-full max-w-[360px] rounded-card',
  bottom: 'w-full max-w-[390px] rounded-t-card',
  left: 'h-full w-[min(360px,90vw)] rounded-r-card',
  right: 'h-full w-[min(360px,90vw)] rounded-l-card',
};

function Scrim({
  position,
  closeOnOutsideClick,
  closeOnEscape,
  sticky,
  onClose,
  children,
}: ScrimProps) {
  useEffect(() => {
    if (sticky || !closeOnEscape) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [sticky, closeOnEscape, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={cn('fixed inset-0 z-[70] flex bg-[rgba(43,36,41,0.32)]', POSITION_WRAP[position])}
      onClick={() => {
        if (!sticky && closeOnOutsideClick) onClose();
      }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'border border-print-edge bg-print p-7 shadow-float animate-settle',
          POSITION_PANEL[position],
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  intent?: 'standard' | 'danger';
  confirmLabel?: string;
  cancelLabel?: string;
  position?: ModalPosition;
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
  sticky?: boolean;
}

export function Modal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  children,
  intent = 'standard',
  confirmLabel,
  cancelLabel = intent === 'danger' ? 'Stay' : 'Cancel',
  position = 'center',
  closeOnOutsideClick = true,
  closeOnEscape = true,
  sticky = false,
}: ModalProps) {
  if (!open) return null;
  const danger = intent === 'danger';

  return (
    <Scrim
      position={position}
      closeOnOutsideClick={closeOnOutsideClick}
      closeOnEscape={closeOnEscape}
      sticky={sticky}
      onClose={onClose}
    >
      {danger ? <CritRule /> : null}
      <h2 className="m-0 mb-2.5 font-serif text-[20px] font-medium tracking-h text-ink">{title}</h2>
      {description ? (
        <div className="m-0 mb-4 font-sans text-[13.5px] leading-relaxed text-ink-2">{description}</div>
      ) : null}
      {children}
      <div className="mt-5 flex items-center justify-between">
        <AppButton variant="quiet" onClick={onClose}>
          {cancelLabel}
        </AppButton>
        {danger ? (
          <HoldToConfirmButton onConfirm={onConfirm}>{confirmLabel ?? 'Hold to confirm'}</HoldToConfirmButton>
        ) : (
          <AppButton variant="primary" onClick={onConfirm}>
            {confirmLabel ?? 'OK'}
          </AppButton>
        )}
      </div>
    </Scrim>
  );
}

export interface CriticalModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: ReactNode;
  description?: ReactNode;
  confirmPhrase: string;
  confirmPrompt: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  children?: ReactNode;
  position?: ModalPosition;
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
  sticky?: boolean;
}

export function CriticalModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmPhrase,
  confirmPrompt,
  confirmLabel,
  cancelLabel = 'Keep',
  children,
  position = 'center',
  closeOnOutsideClick = false,
  closeOnEscape = true,
  sticky = false,
}: CriticalModalProps) {
  const [typed, setTyped] = useState('');
  if (!open) return null;
  const armed = typed === confirmPhrase;

  return (
    <Scrim
      position={position}
      closeOnOutsideClick={closeOnOutsideClick}
      closeOnEscape={closeOnEscape}
      sticky={sticky}
      onClose={onClose}
    >
      <CritRule />
      <h2 className="m-0 mb-2.5 font-serif text-[20px] font-medium tracking-h text-ink">{title}</h2>
      {description ? (
        <div className="m-0 mb-4 font-sans text-[13.5px] leading-relaxed text-ink-2">{description}</div>
      ) : null}
      {children}
      <div className="mt-4">
        <div className="mb-2 font-sans text-[11px] font-semibold uppercase tracking-overline text-crit">
          {confirmPrompt}
        </div>
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value.toUpperCase())}
          placeholder={confirmPhrase}
          autoCapitalize="characters"
          className="w-full border-0 border-b border-crit-edge bg-transparent py-1.5 font-mono text-[15px] uppercase tracking-[0.14em] text-ink outline-none focus:border-crit"
        />
      </div>
      <div className="mt-5 flex items-center justify-between">
        <AppButton variant="quiet" onClick={onClose}>
          {cancelLabel}
        </AppButton>
        <AppButton variant="danger" disabled={!armed} onClick={onConfirm}>
          {confirmLabel}
        </AppButton>
      </div>
    </Scrim>
  );
}

export interface CustomModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  hideCloseButton?: boolean;
  position?: ModalPosition;
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
  sticky?: boolean;
}

export function CustomModal({
  open,
  onClose,
  children,
  hideCloseButton = false,
  position = 'center',
  closeOnOutsideClick = true,
  closeOnEscape = true,
  sticky = false,
}: CustomModalProps) {
  if (!open) return null;
  return (
    <Scrim
      position={position}
      closeOnOutsideClick={closeOnOutsideClick}
      closeOnEscape={closeOnEscape}
      sticky={sticky}
      onClose={onClose}
    >
      {hideCloseButton ? null : (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 inline-flex h-7 w-7 items-center justify-center rounded-full text-ink-3 hover:bg-plum-wash"
        >
          <X size={16} />
        </button>
      )}
      {children}
    </Scrim>
  );
}

function CritRule() {
  return <div className="-mx-7 -mt-7 mb-[22px] h-[3px] rounded-t-card bg-crit" />;
}
