import type { Earthquake } from '../../rayfin/data/Earthquake.js';

interface StatsBarProps {
  earthquakes: Earthquake[];
  syncState: {
    lastSync: Date | null;
    syncing: boolean;
    newCount: number;
    totalSynced: number;
  };
  onSyncNow: () => void;
}

function StatCard({
  label,
  value,
  sub,
  color = 'indigo',
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: 'indigo' | 'amber' | 'red' | 'emerald';
}) {
  const ring: Record<string, string> = {
    indigo: 'ring-indigo-500/40',
    amber: 'ring-amber-500/40',
    red: 'ring-red-500/40',
    emerald: 'ring-emerald-500/40',
  };
  const text: Record<string, string> = {
    indigo: 'text-indigo-400',
    amber: 'text-amber-400',
    red: 'text-red-400',
    emerald: 'text-emerald-400',
  };
  return (
    <div
      className={`rounded-xl bg-slate-800 ring-1 ${ring[color]} p-4 flex flex-col gap-1`}
    >
      <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
        {label}
      </span>
      <span className={`text-3xl font-bold ${text[color]}`}>{value}</span>
      {sub && <span className="text-xs text-slate-500">{sub}</span>}
    </div>
  );
}

export function StatsBar({ earthquakes, syncState, onSyncNow }: StatsBarProps) {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;

  const total = earthquakes.length;
  const maxMag =
    earthquakes.length > 0
      ? Math.max(...earthquakes.map((e) => e.magnitude)).toFixed(1)
      : '—';
  const avgDepth =
    earthquakes.length > 0
      ? (
          earthquakes.reduce((s, e) => s + e.depth, 0) / earthquakes.length
        ).toFixed(1)
      : '—';
  const lastHour = earthquakes.filter(
    (e) => new Date(e.time).getTime() > oneHourAgo,
  ).length;

  const lastSyncStr = syncState.lastSync
    ? syncState.lastSync.toLocaleTimeString()
    : '—';

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Total events (24 h)"
          value={total}
          sub={`${syncState.totalSynced} synced to Rayfin`}
          color="indigo"
        />
        <StatCard
          label="Max magnitude"
          value={maxMag}
          sub="last 24 h"
          color="red"
        />
        <StatCard
          label="Avg depth"
          value={avgDepth !== '—' ? `${avgDepth} km` : '—'}
          sub="hypocentral depth"
          color="amber"
        />
        <StatCard
          label="Events last hour"
          value={lastHour}
          sub="near-realtime count"
          color="emerald"
        />
      </div>

      {/* Sync status bar */}
      <div className="flex items-center justify-between rounded-xl bg-slate-800/50 px-4 py-2 text-xs text-slate-400">
        <span>
          Last sync:{' '}
          <span className="text-slate-300 font-medium">{lastSyncStr}</span>
          {syncState.newCount > 0 && (
            <span className="ml-2 text-emerald-400">
              +{syncState.newCount} new
            </span>
          )}
        </span>
        <button
          onClick={onSyncNow}
          disabled={syncState.syncing}
          className="flex items-center gap-1 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 px-3 py-1 transition text-slate-200 font-medium"
        >
          <span className={syncState.syncing ? 'animate-spin' : ''}>⟳</span>
          {syncState.syncing ? 'Syncing…' : 'Sync now'}
        </button>
      </div>
    </div>
  );
}
