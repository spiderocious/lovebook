import { AppButton, AppText, DrawerService } from '@lovebook/ui';

import { Break, ComponentRow, Section } from '../preview-canvas.tsx';

// Spec: dockito/design-system/projects/lovebook/preview/40-modals.html + 41-feedback.html
// Exercises the full DrawerService surface. The hosts are mounted in app.tsx.
export function OverlaysSection() {
  return (
    <Section
      num="40"
      title="Overlays"
      description="Toasts are the only inverted element, bottom-centre, 3 seconds. The one persistent banner is amber. Full modals exist only for the two irreversible doors — leave pair (hold) and delete account (type DELETE) — each wearing the crimson rule and speaking in the serif."
    >
      <Break label="TOASTS — INK SLIPS" />
      <ComponentRow caption="Swipe a live toast to dismiss it.">
        <AppButton variant="secondary" size="sm" onClick={() => DrawerService.toast('Sent to Tobi', { tone: 'ok' })}>
          Sent (ok)
        </AppButton>
        <AppButton
          variant="secondary"
          size="sm"
          onClick={() => DrawerService.toast('Offline — queued, will send itself', { tone: 'wait' })}
        >
          Queued (wait)
        </AppButton>
        <AppButton
          variant="secondary"
          size="sm"
          onClick={() =>
            DrawerService.toast('Moment sent', {
              tone: 'ok',
              action: { label: 'Undo', onClick: () => DrawerService.toast('Un-sent', { tone: 'default' }) },
            })
          }
        >
          With Undo
        </AppButton>
        <AppButton
          variant="secondary"
          size="sm"
          onClick={() => DrawerService.toast('Pinned — swipe disabled', { sticky: true, position: 'top-right' })}
        >
          Sticky · top-right
        </AppButton>
      </ComponentRow>

      <Break label="THE ONE PERSISTENT BANNER — AMBER" />
      <ComponentRow caption="Banners never stack; a new one replaces the last.">
        <AppButton
          variant="secondary"
          size="sm"
          onClick={() =>
            DrawerService.banner('Your invite code expires in 2 hours.', {
              description: 'Tobi hasn’t claimed it yet.',
              cta: { label: 'Resend', onClick: () => DrawerService.toast('New code sent', { tone: 'ok' }) },
            })
          }
        >
          Show invite banner
        </AppButton>
      </ComponentRow>

      <Break label="THE LIGHT SHEETS" />
      <ComponentRow caption="A half-sheet slides up; the feed stays visible behind it.">
        <AppButton
          variant="secondary"
          size="sm"
          onClick={() =>
            DrawerService.confirm('Replace your reaction?', {
              description: 'You left 😂 on this moment. A moment holds one reaction — the new one takes its place.',
              confirmLabel: 'Use 🥹 instead',
              cancelLabel: 'Keep 😂',
              position: 'bottom',
              onConfirm: () => DrawerService.toast('Reaction replaced', { tone: 'ok' }),
            })
          }
        >
          Replace reaction (half-sheet)
        </AppButton>
        <AppButton
          variant="secondary"
          size="sm"
          onClick={() =>
            DrawerService.openModal(
              <div className="max-w-[320px]">
                <AppText variant="heading" className="mb-2">
                  This invite expired
                </AppText>
                <AppText variant="body">Codes live for 24 hours. Ask Adaeze to send a fresh one.</AppText>
                <div className="mt-5 flex justify-end">
                  <AppButton variant="secondary" size="sm" onClick={() => DrawerService.closeModal()}>
                    Okay
                  </AppButton>
                </div>
              </div>,
            )
          }
        >
          Custom modal
        </AppButton>
      </ComponentRow>

      <Break label="THE TWO HEAVY DOORS — CRIMSON" />
      <ComponentRow caption="Leave pair is held; delete account requires typing DELETE.">
        <AppButton
          variant="danger"
          size="sm"
          onClick={() =>
            DrawerService.confirm('Leave your pair with Tobi?', {
              description:
                'The feed — all 412 moments — is archived for both of you, read-only. This can’t be undone.',
              destructive: true,
              confirmLabel: 'Hold to leave',
              onConfirm: () => DrawerService.toast('You left the pair', { tone: 'default' }),
            })
          }
        >
          Leave pair (hold)
        </AppButton>
        <AppButton
          variant="danger"
          size="sm"
          onClick={() =>
            DrawerService.critical('Delete your account?', {
              description:
                'Your posts and reactions are removed everywhere. Tobi keeps their own copy of your shared history.',
              confirmPhrase: 'DELETE',
              confirmPrompt: <>Type DELETE to continue</>,
              confirmLabel: 'Delete forever',
              cancelLabel: 'Keep my account',
              onConfirm: () => DrawerService.toast('Account deleted', { tone: 'default' }),
            })
          }
        >
          Delete account (type)
        </AppButton>
      </ComponentRow>
    </Section>
  );
}
