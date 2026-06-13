import { useState } from 'react';

import type { Post } from '@lovebook/core';
import {
  AppText,
  PolaroidMoment,
  PostcardMoment,
  Timestamp,
  VoiceMoment,
} from '@lovebook/ui';

import { usePostMedia } from '../../api/use-media.ts';
import { ReactionControl } from './reaction-control.tsx';

// A flat amplitude pattern for the voice waveform until we render real peaks.
const PLACEHOLDER_WAVE = [0.3, 0.6, 0.8, 0.5, 0.9, 0.55, 0.7, 0.4, 0.85, 0.5, 0.65, 0.4];

export function PostCard({
  post,
  authorName,
  myId,
}: {
  post: Post;
  authorName: string;
  myId: string;
}) {
  const reaction = <ReactionControl post={post} myId={myId} />;
  const timestamp = <Timestamp date={post.createdAt} />;

  if (post.type === 'text') {
    // PostcardMoment has no author slot, so the name goes above in the "scrawl"
    // (pencil) voice — the design system's human-author treatment.
    return (
      <div className="flex flex-col gap-1.5">
        <AppText variant="scrawl" className="pl-1 text-ink-3">
          {authorName}
        </AppText>
        <PostcardMoment text={post.text} timestamp={timestamp} reaction={reaction} />
      </div>
    );
  }

  if (post.type === 'photo') {
    return <PhotoCard post={post} author={authorName} timestamp={timestamp} reaction={reaction} />;
  }

  return <VoiceCard post={post} author={authorName} timestamp={timestamp} reaction={reaction} />;
}

function PhotoCard({
  post,
  author,
  timestamp,
  reaction,
}: {
  post: Post;
  author: string;
  timestamp: React.ReactNode;
  reaction: React.ReactNode;
}) {
  const media = usePostMedia(post.id);
  return (
    <PolaroidMoment
      src={media.data?.uri}
      author={author}
      timestamp={timestamp}
      reaction={reaction}
      loading={media.isLoading}
    />
  );
}

function VoiceCard({
  post,
  author,
  timestamp,
  reaction,
}: {
  post: Post;
  author: string;
  timestamp: React.ReactNode;
  reaction: React.ReactNode;
}) {
  const media = usePostMedia(post.id);
  const [playing, setPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const durationLabel = formatDuration(post.durationMs ?? 0);

  const toggle = () => {
    if (!media.data?.uri) return;
    let el = audio;
    if (!el) {
      el = new Audio(media.data.uri);
      el.addEventListener('ended', () => setPlaying(false));
      setAudio(el);
    }
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      void el.play();
      setPlaying(true);
    }
  };

  return (
    <VoiceMoment
      waveform={PLACEHOLDER_WAVE}
      duration={durationLabel}
      author={author}
      timestamp={timestamp}
      reaction={reaction}
      playing={playing}
      onPlayToggle={toggle}
    />
  );
}

function formatDuration(ms: number): string {
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
