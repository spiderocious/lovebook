import { useMutation, useQueryClient } from '@tanstack/react-query';

import { EP } from '@lovebook/api';
import type { UpdateMeBody, User } from '@lovebook/core';

import { meQueryKey } from '@features/auth/api/use-auth.ts';
import { patchData, sendNoContent } from '@shared/api/unwrap.ts';
import { tokens } from '@shared/auth/tokens.ts';

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateMeBody) => patchData<User>(EP.ME, body),
    onSuccess: (user) => qc.setQueryData(meQueryKey, user),
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => sendNoContent('delete', EP.ME),
    onSuccess: () => {
      tokens.clear();
      qc.clear();
    },
  });
}
