import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { EP } from '@lovebook/api';
import type {
  AuthResult,
  LoginBody,
  RegisterBody,
  User,
} from '@lovebook/core';

import { getData, postData, sendNoContent } from '@shared/api/unwrap.ts';
import { tokens } from '@shared/auth/tokens.ts';

export const meQueryKey = ['auth', 'me'] as const;

/** The current user, bootstrapped from a stored token. `enabled` only when a session exists. */
export function useMe(enabled: boolean) {
  return useQuery({
    queryKey: meQueryKey,
    queryFn: () => getData<User>(EP.AUTH_ME),
    enabled,
    retry: false,
    staleTime: 10 * 60 * 1000,
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: RegisterBody) => postData<AuthResult>(EP.AUTH_REGISTER, body),
    onSuccess: (result) => {
      tokens.set(result.tokens);
      qc.setQueryData(meQueryKey, result.user);
    },
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: LoginBody) => postData<AuthResult>(EP.AUTH_LOGIN, body),
    onSuccess: (result) => {
      tokens.set(result.tokens);
      qc.setQueryData(meQueryKey, result.user);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => sendNoContent('post', EP.AUTH_LOGOUT),
    onSettled: () => {
      tokens.clear();
      qc.clear(); // drop all cached server state for the previous session
    },
  });
}
