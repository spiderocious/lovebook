import { CopyToClipboard } from 'meemaw';

import { cn } from '../../utils/cn.ts';

/**
 * InviteCodeDisplay — the inviter's side. The code is display, not input.
 *
 * Visual spec: dockito/design-system/projects/lovebook/preview/11-inputs.html (Your invite)
 * Tokens:      _foundation.css — --mono, --plum
 *
 * Mono, huge, unmistakable over a shoulder or in a screenshot. The copy action
 * uses meemaw's CopyToClipboard for the `copied` confirmation state. `expiry` is
 * shown as the record line beneath it ("expires in 23 h 41 m").
 */
export interface InviteCodeDisplayProps {
  code: string;
  /** What gets copied — usually a full invite URL. Defaults to the code. */
  copyText?: string;
  expiryLabel?: string;
  className?: string;
}

export function InviteCodeDisplay({ code, copyText, expiryLabel, className }: InviteCodeDisplayProps) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-baseline gap-3.5">
        <span className="font-mono text-[34px] font-medium tracking-[0.1em] text-ink [font-feature-settings:'tnum'_1,'lnum'_1]">
          {code}
        </span>
        <CopyToClipboard text={copyText ?? code}>
          {(copy, copied) => (
            <button
              type="button"
              onClick={copy}
              className="inline-flex h-9 items-center rounded-pill bg-plum-wash px-[18px] font-sans text-[13px] font-semibold text-plum transition-colors hover:bg-plum-wash-2"
            >
              {copied ? 'Copied' : 'Copy link'}
            </button>
          )}
        </CopyToClipboard>
      </div>
      {expiryLabel ? (
        <span className="font-mono text-[11.5px] text-ink-3 [font-feature-settings:'tnum'_1,'lnum'_1]">
          {expiryLabel}
        </span>
      ) : null}
    </div>
  );
}
