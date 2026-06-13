import { Link } from 'react-router-dom';

import { ROUTES } from '@lovebook/core';
import { AppText, EmptyState, Skeleton, Timestamp } from '@lovebook/ui';
import { IconBack } from '@icons';
import { Loadable, Repeat, Show } from 'meemaw';

import { useAuth } from '@features/auth/providers/auth-provider.tsx';
import { useArchives } from '@features/pair/api/use-pair.ts';

export function PastPairsScreen() {
  const { user } = useAuth();
  const archives = useArchives();

  return (
    <main className="mx-auto min-h-dvh max-w-md px-5 py-6">
      <div className="mb-6 flex items-center gap-3">
        <Link to={ROUTES.SETTINGS} aria-label="Back to settings" className="text-ink-3 hover:text-ink">
          <IconBack size={22} />
        </Link>
        <AppText variant="heading" as="h1">
          Past pairs
        </AppText>
      </div>

      <Loadable
        loading={archives.isLoading}
        error={archives.isError}
        loadingComponent={<Skeleton kind="postcard" />}
        errorComponent={<EmptyState message="We couldn’t load your past pairs." />}
      >
        <Show
          when={(archives.data?.length ?? 0) > 0}
          fallback={<EmptyState message="No past pairs yet." />}
        >
          <ul className="flex flex-col gap-3">
            <Repeat each={archives.data ?? []}>
              {(pair) => {
                const other = pair.members.find((m) => m.id !== user?.id);
                return (
                  <li
                    key={pair.id}
                    className="flex items-center justify-between rounded-card border border-hair bg-print px-4 py-3"
                  >
                    <AppText variant="body">{other?.name ?? 'A past pair'}</AppText>
                    <Show when={Boolean(pair.archivedAt)}>
                      <AppText variant="record" className="text-ink-3">
                        <Timestamp date={pair.archivedAt ?? pair.createdAt} />
                      </AppText>
                    </Show>
                  </li>
                );
              }}
            </Repeat>
          </ul>
        </Show>
      </Loadable>
    </main>
  );
}
