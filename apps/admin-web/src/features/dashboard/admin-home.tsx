import { useHealth } from '@lovebook/api';
import { AppText } from '@lovebook/ui';

export function AdminHome() {
  const { data, isLoading, isError } = useHealth();

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <AppText variant="caption">admin</AppText>
      <AppText variant="heading-1" className="mt-2 text-brand-900">
        Platform operations
      </AppText>
      <AppText variant="body" className="mt-4 text-ink-700">
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
    <div className="rounded-lg border border-brand-900/10 bg-white p-4 shadow-sm">
      <AppText variant="caption">{label}</AppText>
      <p className="mt-2 font-serif text-2xl text-brand-900">{value}</p>
      <p className="mt-1 text-xs text-ink-700">{hint}</p>
    </div>
  );
}
