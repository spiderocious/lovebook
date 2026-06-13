import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { ROUTES } from '@lovebook/core';
import { AppButton, AppText, ChromeField, InlineBanner } from '@lovebook/ui';
import { Show } from 'meemaw';

import { fieldError, topLevelError } from '@shared/api/form-errors.ts';

import { useLogin } from '../api/use-auth.ts';
import { AuthShell } from './parts/auth-shell.tsx';

export function LoginScreen() {
  const navigate = useNavigate();
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    login.mutate(
      { email, password },
      { onSuccess: () => navigate(ROUTES.PAIR, { replace: true }) },
    );
  };

  const top = topLevelError(login.error);

  return (
    <AuthShell
      title="Welcome back."
      footer={
        <AppText variant="body-sm" className="text-ink-3">
          New here?{' '}
          <Link to={ROUTES.REGISTER} className="text-plum underline">
            Create an account
          </Link>
        </AppText>
      }
    >
      <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
        <ChromeField
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={Boolean(fieldError(login.error, 'email'))}
        />
        <ChromeField
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={Boolean(fieldError(login.error, 'password'))}
        />

        <Show when={Boolean(top)}>
          <InlineBanner>{top}</InlineBanner>
        </Show>

        <AppButton type="submit" size="lg" loading={login.isPending}>
          Sign in
        </AppButton>
      </form>
    </AuthShell>
  );
}
