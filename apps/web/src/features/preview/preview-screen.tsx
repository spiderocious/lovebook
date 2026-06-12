import { useEffect, useState } from 'react';

import { Repeat } from 'meemaw';

import { PreviewNav } from './preview-canvas.tsx';
import { PREVIEW_SECTIONS, type PreviewSection } from './preview-sections.tsx';

// The @lovebook/ui viewer. A standalone route that renders every component in
// its real situations. The designer reviews here. The Lamplight toggle sets
// `.lamplight` on <html> so the whole system flips to the 11pm room — the same
// shoebox dimmed, not an inversion.
export function PreviewScreen() {
  const [lamplight, setLamplight] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('lamplight', lamplight);
    return () => root.classList.remove('lamplight');
  }, [lamplight]);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="mx-auto flex max-w-[1240px] gap-10 px-8 py-12">
        <aside className="sticky top-12 hidden h-[calc(100vh-6rem)] w-56 shrink-0 overflow-y-auto lg:block">
          <div className="mb-8">
            <div className="font-display text-[22px] font-medium tracking-display">lovebook</div>
            <div className="mt-1 font-mono text-[10px] text-ink-3">the shoebox · @lovebook/ui</div>
          </div>
          <button
            type="button"
            onClick={() => setLamplight((v) => !v)}
            className="mb-8 inline-flex items-center gap-2 rounded-pill bg-plum-wash px-3 py-1.5 text-[12px] font-semibold text-plum transition-colors hover:bg-plum-wash-2"
          >
            {lamplight ? 'Lamplight on' : 'Lamplight off'}
          </button>
          <PreviewNav items={PREVIEW_SECTIONS} />
        </aside>

        <main className="min-w-0 flex-1">
          <Repeat<PreviewSection> each={[...PREVIEW_SECTIONS]}>
            {(section) => <div key={section.id}>{section.render()}</div>}
          </Repeat>
        </main>
      </div>
    </div>
  );
}
