import { useHealth } from '@lovebook/api';
import { AppText } from '@lovebook/ui';

export function AdminHome() {
  const { data, isLoading, isError } = useHealth();

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <AppText variant="overline">admin</AppText>
      <AppText variant="heading" className="mt-2 text-ink">
        Platform operations
      </AppText>
      <AppText variant="body" className="mt-4">
        Manage users, audit logs and platform-level configuration. Placeholder
        console — wire the tiles to real data as features land.
      </AppText>

      <section className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Tile label="users" value="—" hint="connect once auth lands" />
        <Tile label="items" value="—" hint="connect to /api/v1/example" />
        <Tile
          label="backend"
          value={isLoading ? '…' : isError ? 'down' : (data?.status ?? '—')}
          hint="from /api/v1/health"
        />
      </section>
    </main>
  );
}

function Tile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-card border border-print-edge bg-print p-4">
      <AppText variant="overline">{label}</AppText>
      <p className="mt-2 font-serif text-2xl text-ink">{value}</p>
      <p className="mt-1 text-xs text-ink-3">{hint}</p>
    </div>
  );
}
