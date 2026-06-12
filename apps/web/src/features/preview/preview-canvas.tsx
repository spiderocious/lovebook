import { type ReactNode } from 'react';

import { Repeat } from 'meemaw';

// The preview canvas — shared chrome for every component specimen.
// Mirrors the Studio specimen layout (a "stamp" header, "break" section rules,
// captioned rows) so reviewing here feels like reviewing the HTML spec.
//
// Source spec: dockito/design-system/projects/lovefeed/preview/

export function Section({
  num,
  title,
  description,
  children,
}: {
  num: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-20 scroll-mt-8" id={`s-${num}`}>
      <div className="mb-9 flex items-baseline gap-4 border-b border-ink pb-4">
        <span className="font-mono text-[11px] text-ink-3">{num}</span>
        <h2 className="flex-1 font-display text-[28px] font-medium leading-none tracking-display">
          {title}
        </h2>
      </div>
      {description ? (
        <p className="mb-8 max-w-[68ch] text-[14px] leading-relaxed text-ink-2">{description}</p>
      ) : null}
      <div className="flex flex-col gap-8">{children}</div>
    </section>
  );
}

export function Break({ label }: { label: string }) {
  return (
    <div className="mt-6 flex items-center gap-4">
      <span className="h-px w-6 shrink-0 bg-hair" />
      <span className="font-mono text-[11px] text-ink-3">{label}</span>
      <span className="h-px flex-1 bg-hair" />
    </div>
  );
}

export function ComponentRow({
  label,
  caption,
  children,
  align = 'center',
}: {
  label?: string;
  caption?: string;
  children: ReactNode;
  align?: 'center' | 'start';
}) {
  return (
    <div className="rounded-card border border-print-edge bg-print p-6">
      {label ? (
        <div className="mb-4 font-sans text-[11px] font-semibold uppercase tracking-overline text-ink-3">
          {label}
        </div>
      ) : null}
      <div className={`flex flex-wrap gap-5 ${align === 'center' ? 'items-center' : 'items-start'}`}>
        {children}
      </div>
      {caption ? <p className="mt-4 text-[12px] leading-relaxed text-ink-3">{caption}</p> : null}
    </div>
  );
}

export function Swatch({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      {children}
      {label ? <span className="font-mono text-[11px] text-ink-3">{label}</span> : null}
    </div>
  );
}

export interface PreviewNavItem {
  readonly id: string;
  readonly label: string;
  readonly group: string;
}

// A small navigable table of contents, rendered in the sidebar.
export function PreviewNav({ items }: { items: ReadonlyArray<PreviewNavItem> }) {
  const groupOrder = [...new Set(items.map((i) => i.group))];

  return (
    <nav className="flex flex-col gap-6">
      <Repeat each={groupOrder}>
        {(group) => (
          <div key={group}>
            <div className="mb-2 font-sans text-[10px] font-semibold uppercase tracking-overline text-ink-4">
              {group}
            </div>
            <Repeat each={items.filter((i) => i.group === group)}>
              {(item) => (
                <a
                  key={item.id}
                  href={`#s-${item.id}`}
                  className="block rounded-pill px-3 py-1.5 text-[13px] text-ink-2 transition-colors hover:bg-plum-wash hover:text-ink"
                >
                  {item.label}
                </a>
              )}
            </Repeat>
          </div>
        )}
      </Repeat>
    </nav>
  );
}
