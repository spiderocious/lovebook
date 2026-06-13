import { useEffect, useRef, useState } from 'react';

import { AppButton, AppText, VoiceRecorder, VoiceMoment } from '@lovebook/ui';
import { Show } from 'meemaw';

import { useCompose } from '../../api/use-compose.ts';
import { useRecorder } from './use-recorder.ts';

const PREVIEW_WAVE = [0.3, 0.6, 0.8, 0.5, 0.9, 0.55, 0.7, 0.4, 0.85, 0.5, 0.65, 0.4];
const LIVE_WAVE = [0.4, 0.7, 0.5, 0.85, 0.6, 0.45, 0.8];

// Voice door (PRD §5): hold to record (WhatsApp muscle memory), hard stop at
// 0:30, release to preview, then Send or Retake.
export function ComposeVoice({ onDone, partnerName }: { onDone: () => void; partnerName: string }) {
  const { compose } = useCompose();
  const rec = useRecorder();
  const [sending, setSending] = useState(false);

  // Local playback of the just-recorded blob so the user can hear it before
  // sending. The audio element is rebuilt whenever a new recording lands.
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!rec.result) {
      audioRef.current = null;
      setPlaying(false);
      return;
    }
    const url = URL.createObjectURL(rec.result.blob);
    const el = new Audio(url);
    el.addEventListener('ended', () => setPlaying(false));
    audioRef.current = el;
    setPlaying(false);
    return () => {
      el.pause();
      URL.revokeObjectURL(url);
      audioRef.current = null;
    };
  }, [rec.result]);

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      el.currentTime = 0;
      void el.play();
      setPlaying(true);
    }
  };

  const send = async () => {
    if (!rec.result) return;
    setSending(true);
    try {
      await compose({
        type: 'voice',
        blob: rec.result.blob,
        ext: 'webm',
        durationMs: rec.result.durationMs,
      });
      onDone();
    } finally {
      setSending(false);
    }
  };

  const durationLabel = rec.result
    ? `0:${Math.round(rec.result.durationMs / 1000).toString().padStart(2, '0')}`
    : '0:00';

  return (
    <div className="flex flex-col gap-5 p-2">
      <AppText variant="overline" className="text-ink-3">
        A voice note to {partnerName}
      </AppText>

      <Show when={Boolean(rec.error)}>
        <AppText variant="body" className="text-crit">
          {rec.error}
        </AppText>
      </Show>

      <Show when={!rec.result}>
        <VoiceRecorder
          seconds={rec.seconds}
          maxSeconds={30}
          waveform={LIVE_WAVE}
          recording={rec.recording}
          onHoldStart={() => void rec.start()}
          onHoldEnd={rec.stop}
        />
        <AppText variant="body-sm" className="text-center text-ink-3">
          Hold to record · release to preview
        </AppText>
      </Show>

      <Show when={Boolean(rec.result)}>
        <VoiceMoment
          waveform={PREVIEW_WAVE}
          duration={durationLabel}
          playing={playing}
          onPlayToggle={togglePlay}
        />
        <div className="flex justify-between">
          <AppButton variant="quiet" onClick={rec.reset}>
            Retake
          </AppButton>
          <AppButton onClick={send} loading={sending}>
            Send to {partnerName}
          </AppButton>
        </div>
      </Show>

      <AppButton variant="quiet" onClick={onDone}>
        Cancel
      </AppButton>
    </div>
  );
}
