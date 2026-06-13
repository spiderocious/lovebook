import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { EP } from '@lovebook/api';
import type { Invite, InvitePreview, Pair } from '@lovebook/core';

import { getData, postData } from '@shared/api/unwrap.ts';
import { meQueryKey } from '@features/auth/api/use-auth.ts';

export const pairQueryKey = ['pair'] as const;
export const archivesQueryKey = ['pair', 'archives'] as const;
export const inviteLookupQueryKey = (ref: string) => ['pair', 'lookup', ref] as const;

/** The caller's current active pair (or null). Poll while waiting to be claimed. */
export function usePair(options?: { refetchInterval?: number | false }) {
  return useQuery({
    queryKey: pairQueryKey,
    queryFn: () => getData<Pair | null>(EP.PAIR),
    refetchInterval: options?.refetchInterval ?? false,
  });
}

export function useCreateInvite() {
  return useMutation({
    mutationFn: () => postData<Invite>(EP.PAIR_INVITE),
  });
}

export function useInviteLookup(ref: string, enabled: boolean) {
  return useQuery({
    queryKey: inviteLookupQueryKey(ref),
    queryFn: () => getData<InvitePreview>(EP.PAIR_LOOKUP(ref)),
    enabled,
    retry: false,
  });
}

export function useClaimPair() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ref: string) => postData<Pair>(EP.PAIR_CLAIM, { ref }),
    onSuccess: (pair) => {
      qc.setQueryData(pairQueryKey, pair);
      // The user's pairId changed — refresh the session so guards re-route.
      void qc.invalidateQueries({ queryKey: meQueryKey });
    },
  });
}

export function useLeavePair() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => postData<{ archivedPairId: string }>(EP.PAIR_LEAVE),
    onSuccess: () => {
      qc.setQueryData(pairQueryKey, null);
      void qc.invalidateQueries({ queryKey: meQueryKey });
      void qc.invalidateQueries({ queryKey: archivesQueryKey });
    },
  });
}

export function useArchives() {
  return useQuery({
    queryKey: archivesQueryKey,
    queryFn: () => getData<Pair[]>(EP.PAIR_ARCHIVES),
  });
}
