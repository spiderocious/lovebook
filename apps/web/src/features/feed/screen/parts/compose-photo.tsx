import { useEffect, useRef, useState } from 'react';

import { AppButton, AppText } from '@lovebook/ui';
import { Show } from 'meemaw';

import { errorText, useComposeSend } from './use-compose-send.ts';

// Photo door (PRD §5): the device camera opens, you take a photo, preview it,
// then Send or Retake. No filters, no crop, no caption — the photo is the post.
export function ComposePhoto({ onDone, partnerName }: { onDone: () => void; partnerName: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const { send, sending, error } = useComposeSend(onDone);

  // Open the picker/camera once when the door opens. The ref guard makes this
  // StrictMode-proof — without it the dev double-mount fires .click() twice and
  // the picker opens (and a photo can be posted) twice.
  const openedRef = useRef(false);
  useEffect(() => {
    if (openedRef.current) return;
    openedRef.current = true;
    inputRef.current?.click();
  }, []);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (picked) setFile(picked);
    else onDone(); // cancelled the camera
  };

  const extOf = (f: File): string => {
    const fromName = f.name.split('.').pop();
    if (fromName && /^[a-z0-9]+$/i.test(fromName)) return fromName.toLowerCase();
    return f.type === 'image/png' ? 'png' : 'jpg';
  };

  const onSend = () => {
    if (!file) return;
    void send({ type: 'photo', blob: file, ext: extOf(file) });
  };

  return (
    <div className="flex flex-col gap-4 p-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onPick}
      />

      <Show when={Boolean(preview)}>
        <AppText variant="overline" className="text-ink-3">
          To {partnerName}
        </AppText>
        <img
          src={preview ?? ''}
          alt="Your photo, ready to send"
          className="aspect-[3/4] w-full rounded-[10px] object-cover"
        />
        <Show when={Boolean(error)}>
          <AppText variant="body-sm" className="text-crit">
            {errorText(error)}
          </AppText>
        </Show>
        <div className="flex justify-between">
          <AppButton
            variant="quiet"
            onClick={() => inputRef.current?.click()}
            disabled={sending}
          >
            Retake
          </AppButton>
          <AppButton onClick={onSend} loading={sending}>
            {error ? 'Try again' : `Send to ${partnerName}`}
          </AppButton>
        </div>
      </Show>

      <Show when={!preview}>
        <AppText variant="voice" className="py-8 text-center text-ink-3">
          Opening the camera…
        </AppText>
      </Show>
    </div>
  );
}
