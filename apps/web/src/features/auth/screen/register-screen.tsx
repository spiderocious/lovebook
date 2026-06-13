import { type FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { ROUTES } from '@lovebook/core';
import { AppButton, AppText, ChromeField, InlineBanner } from '@lovebook/ui';
import { Show } from 'meemaw';

import { fieldError, topLevelError } from '@shared/api/form-errors.ts';

import { useRegister } from '../api/use-auth.ts';
import { AuthShell } from './parts/auth-shell.tsx';

export function RegisterScreen() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const register = useRegister();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // If the user arrived from an invite link, carry the ref through sign-up so we
  // can drop them straight onto the claim confirmation afterwards.
  const pairRef = params.get('pair');

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    register.mutate(
      { name, email, password },
      {
        onSuccess: () =>
          navigate(pairRef ? ROUTES.PAIR_INVITE(pairRef) : ROUTES.PAIR, { replace: true }),
      },
    );
  };

  const top = topLevelError(register.error);

  return (
    <AuthShell
      title="A quiet place for two."
      subtitle="Post a moment, your person sees it. No replies, no metrics, just presence."
      footer={
        <AppText variant="body-sm" className="text-ink-3">
          Already have an account?{' '}
          <Link to={ROUTES.LOGIN} className="text-plum underline">
            Sign in
          </Link>
        </AppText>
      }
    >
      <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
        <div>
          <ChromeField
            label="Your name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={Boolean(fieldError(register.error, 'name'))}
          />
          <FieldHint error={fieldError(register.error, 'name')} />
        </div>
        <div>
          <ChromeField
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(fieldError(register.error, 'email'))}
          />
          <FieldHint error={fieldError(register.error, 'email')} />
        </div>
        <div>
          <ChromeField
            label="Password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={Boolean(fieldError(register.error, 'password'))}
          />
          <FieldHint error={fieldError(register.error, 'password') ?? 'At least 8 characters.'} />
        </div>

        <Show when={Boolean(top)}>
          <InlineBanner>{top}</InlineBanner>
        </Show>

        <AppButton type="submit" size="lg" loading={register.isPending}>
          Create account
        </AppButton>
      </form>
    </AuthShell>
  );
}

function FieldHint({ error }: { error?: string }) {
  return (
    <Show when={Boolean(error)}>
      <p role="alert" className="mt-1 text-[12px] text-ink-3">
        {error}
      </p>
    </Show>
  );
}
