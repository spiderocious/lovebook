import { useCallback, useRef, useState } from 'react';

import { VOICE_MAX_DURATION_MS } from '@lovebook/core';

interface Recording {
  blob: Blob;
  durationMs: number;
  mimeType: string;
}

// Thin MediaRecorder wrapper for the voice door: hold to record, hard stop at
// 30s (PRD), release to preview. Produces an Opus/WebM blob.
export function useRecorder() {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [result, setResult] = useState<Recording | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const capRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const cleanup = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (capRef.current) clearTimeout(capRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      const rec = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      rec.onstop = () => {
        const durationMs = Math.min(Date.now() - startedAtRef.current, VOICE_MAX_DURATION_MS);
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setResult({ blob, durationMs, mimeType });
        cleanup();
      };
      recorderRef.current = rec;
      startedAtRef.current = Date.now();
      rec.start();
      setRecording(true);
      setSeconds(0);
      tickRef.current = setInterval(() => {
        setSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }, 200);
      // Hard cap at 30s (PRD). Stop inline to avoid a forward reference to `stop`.
      capRef.current = setTimeout(() => {
        if (recorderRef.current && recorderRef.current.state !== 'inactive') {
          recorderRef.current.stop();
        }
        setRecording(false);
      }, VOICE_MAX_DURATION_MS);
    } catch {
      setError('Microphone access was denied.');
      cleanup();
    }
  }, [cleanup]);

  const stop = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    setRecording(false);
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setSeconds(0);
    setError(null);
  }, []);

  return { recording, seconds, result, error, start, stop, reset };
}
