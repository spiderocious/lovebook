import { useState } from 'react';

import { TEXT_MAX_LENGTH } from '@lovebook/core';
import { AppButton, AppText, LineField } from '@lovebook/ui';

import { useCompose } from '../../api/use-compose.ts';

export function ComposeNote({ onDone, partnerName }: { onDone: () => void; partnerName: string }) {
  const { compose } = useCompose();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const trimmed = text.trim();
  const canSend = trimmed.length > 0 && trimmed.length <= TEXT_MAX_LENGTH;

  const send = async () => {
    if (!canSend) return;
    setSending(true);
    try {
      await compose({ type: 'text', text: trimmed });
      onDone();
    } finally {
      setSending(false);
    }
  };

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
      <div className="flex justify-end gap-2">
        <AppButton variant="quiet" onClick={onDone}>
          Cancel
        </AppButton>
        <AppButton onClick={send} loading={sending} disabled={!canSend}>
          Send
        </AppButton>
      </div>
    </div>
  );
}
