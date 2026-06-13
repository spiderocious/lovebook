import { useRef, useState } from 'react';

import { DEFAULT_REACTION, REACTIONS, type Post } from '@lovebook/core';
import { AppText, ReactionButton, ReactionPicker } from '@lovebook/ui';
import { Show } from 'meemaw';

import { useClearReaction, useSetReaction } from '../../api/use-reaction.ts';

// The one allowed response (PRD): tap leaves the default ❤️; long-press opens
// the picker of 6 alternatives. Re-tapping with the picker replaces; tapping the
// same emoji again clears. The picker uses the CORE reaction set (what the
// backend validates), not the UI package's default list.
//
// A pair has up to two reactors. We show a count to the LEFT of the button (the
// total who reacted) and the button reflects MY reaction — active if I've reacted,
// empty if not. So: partner likes → "1" + empty heart; I like → "2" + my emoji.
const LONG_PRESS_MS = 350;

export function ReactionControl({ post, myId }: { post: Post; myId: string }) {
  const setReaction = useSetReaction(myId);
  const clearReaction = useClearReaction(myId);
  const [pickerOpen, setPickerOpen] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);

  const mine = post.reactions.find((r) => r.reactorId === myId)?.emoji;
  const count = post.reactions.length;

  const onPointerDown = () => {
    longPressed.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressed.current = true;
      setPickerOpen(true);
    }, LONG_PRESS_MS);
  };

  const onPointerUp = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (longPressed.current) return; // long-press already opened the picker
    // Plain tap: toggle my default reaction.
    if (mine === DEFAULT_REACTION) clearReaction.mutate(post.id);
    else setReaction.mutate({ postId: post.id, emoji: DEFAULT_REACTION });
  };

  const onPick = (emoji: string) => {
    setPickerOpen(false);
    if (emoji === mine) clearReaction.mutate(post.id);
    else setReaction.mutate({ postId: post.id, emoji });
  };

  return (
    <div className="relative flex items-center gap-1.5">
      <Show when={count > 0}>
        <AppText variant="record" className="text-ink-3" aria-label={`${count} reactions`}>
          {count}
        </AppText>
      </Show>
      <div className="relative">
        <ReactionButton
          emoji={mine}
          changing={setReaction.isPending}
          onClick={() => {
            /* tap handled on pointer up to disambiguate from long-press */
          }}
          aria-label={mine ? `You reacted ${mine}` : 'React'}
        />
        {/* Pointer/touch handlers for the tap-vs-long-press gesture. */}
        <span
          className="absolute inset-0"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerLeave={() => longPressTimer.current && clearTimeout(longPressTimer.current)}
          role="presentation"
        />
        <Show when={pickerOpen}>
          <div className="absolute bottom-full right-0 z-10 mb-2">
            <ReactionPicker selected={mine} options={REACTIONS} onSelect={onPick} />
          </div>
        </Show>
      </div>
    </div>
  );
}
