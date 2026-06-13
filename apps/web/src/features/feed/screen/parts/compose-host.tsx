import { ComposeBar, type ComposeDoor, DrawerService } from '@lovebook/ui';

import { ComposeNote } from './compose-note.tsx';
import { ComposePhoto } from './compose-photo.tsx';
import { ComposeVoice } from './compose-voice.tsx';

// The bottom compose bar — three doors. Each opens its composer as a half-sheet
// over the feed (the feed stays visible behind it, per PRD §5).
export function ComposeHost({ partnerName }: { partnerName: string }) {
  const open = (door: ComposeDoor) => {
    const close = () => DrawerService.closeModal();
    const body =
      door === 'note' ? (
        <ComposeNote partnerName={partnerName} onDone={close} />
      ) : door === 'photo' ? (
        <ComposePhoto partnerName={partnerName} onDone={close} />
      ) : (
        <ComposeVoice partnerName={partnerName} onDone={close} />
      );
    DrawerService.openModal(body, { position: 'bottom' });
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center pb-[max(env(safe-area-inset-bottom),1rem)]">
      <div className="pointer-events-auto">
        <ComposeBar onCompose={open} />
      </div>
    </div>
  );
}
