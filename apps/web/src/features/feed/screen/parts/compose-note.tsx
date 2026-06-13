import { useState } from 'react';

import { TEXT_MAX_LENGTH } from '@lovebook/core';
import { AppButton, AppText, LineField } from '@lovebook/ui';
import { Show } from 'meemaw';

import { errorText, useComposeSend } from './use-compose-send.ts';

export function ComposeNote({ onDone, partnerName }: { onDone: () => void; partnerName: string }) {
  const [text, setText] = useState('');
  const { send, sending, error } = useComposeSend(onDone);

  const trimmed = text.trim();
  const canSend = trimmed.length > 0 && trimmed.length <= TEXT_MAX_LENGTH;

  return (
    <div className="flex flex-col gap-5 p-2">
      <AppText variant="overline" className="text-ink-3">
        A line to {partnerName}
      </AppText>
      <LineField
        autoFocus
        value={text}
        onValueChange={setText}
        maxLength={TEXT_MAX_LENGTH}
        showCounter
        placeholder="Say one thing…"
        aria-label="Your note"
      />
      <Show when={Boolean(error)}>
        <AppText variant="body-sm" className="text-crit">
          {errorText(error)}
        </AppText>
      </Show>
      <div className="flex justify-end gap-2">
        <AppButton variant="quiet" onClick={onDone} disabled={sending}>
          Cancel
        </AppButton>
        <AppButton
          onClick={() => void send({ type: 'text', text: trimmed })}
          loading={sending}
          disabled={!canSend}
        >
          {error ? 'Try again' : 'Send'}
        </AppButton>
      </div>
    </div>
  );
}
