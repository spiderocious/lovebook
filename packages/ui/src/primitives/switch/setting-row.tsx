import { type ReactNode } from 'react';

import { cn } from '../../utils/cn.ts';

/**
 * SettingRow — the labelled row a Switch lives in.
 *
 * Visual spec: dockito/design-system/projects/lovebook/preview/12-reactions.html (.switchrow)
 *
 * A title + a one-line description on the left, the control on the right,
 * separated by a hairline. The sentence does the explaining so the control
 * stays wordless.
 */
export interface SettingRowProps {
  title: ReactNode;
  description?: ReactNode;
  control: ReactNode;
  className?: string;
}

export function SettingRow({ title, description, control, className }: SettingRowProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 border-b border-hair py-3.5 last:border-b-0',
        className,
      )}
    >
      <div className="min-w-0">
        <div className="font-sans text-[14px] font-semibold text-ink">{title}</div>
        {description ? (
          <div className="mt-0.5 font-sans text-[12.5px] text-ink-3">{description}</div>
        ) : null}
      </div>
      {control}
    </div>
  );
}
