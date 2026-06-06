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
  colorClass,
}: {
  label: string;
  value: string | number;
  sub?: string;
  colorClass: string;
}) {
  return (
    <div className="rounded-xl bg-slate-800/70 border border-slate-700/50 p-4 flex flex-col gap-1.5 hover:border-slate-600/70 transition-colors">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
        {label}
      </span>
      <span className={`text-3xl font-bold tabular-nums leading-none ${colorClass}`}>
        {value}
      </span>
      {sub && <span className="text-xs text-slate-600">{sub}</span>}
    </div>
  );
}

export function StatsBar({ earthquakes, syncState, onSyncNow }: StatsBarProps) {
  const total = earthquakes.length;
  const maxMag =
    total > 0
      ? Math.max(...earthquakes.map((e) => e.magnitude)).toFixed(1)
      : '—';
  const avgDepth =
    total > 0
      ? (earthquakes.reduce((s, e) => s + e.depth, 0) / total).toFixed(1)
      : '—';
  const lastHour = earthquakes.filter(
    (e) => new Date(e.time).getTime() > Date.now() - 3_600_000,
  ).length;

  const maxMagNum = Number(maxMag);
  const magColorClass =
    maxMagNum >= 4 ? 'text-red-400' : maxMagNum >= 2.5 ? 'text-orange-400' : 'text-amber-400';

  const lastSyncStr = syncState.lastSync
    ? syncState.lastSync.toLocaleTimeString('it-IT', { timeStyle: 'short' })
    : 'Never';

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Events"
          value={total}
          sub="within active filters"
          colorClass="text-indigo-400"
        />
        <StatCard
          label="Max magnitude"
          value={maxMag}
          sub="within filter"
          colorClass={magColorClass}
        />
        <StatCard
          label="Avg depth"
          value={avgDepth !== '—' ? `${avgDepth} km` : '—'}
          sub="hypocentral depth"
          colorClass="text-amber-400"
        />
        <StatCard
          label="Last hour"
          value={lastHour}
          sub="near-realtime count"
          colorClass="text-emerald-400"
        />
      </div>

      <div className="flex items-center justify-between rounded-xl bg-slate-800/50 border border-slate-700/40 px-4 py-2.5 text-xs text-slate-500">
        <span>
          Last sync with Fabric:{' '}
          <span className="text-slate-300 font-semibold">{lastSyncStr}</span>
          {syncState.newCount > 0 && (
            <span className="ml-2 text-emerald-400 font-semibold">
              +{syncState.newCount} new
            </span>
          )}
        </span>
        <button
          onClick={onSyncNow}
          disabled={syncState.syncing}
          className="flex items-center gap-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 border border-slate-600/60 disabled:opacity-40 px-3 py-1 transition-all text-slate-300 font-semibold"
        >
          <svg
            className={`w-3.5 h-3.5 ${syncState.syncing ? 'animate-spin' : ''}`}
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M14 8A6 6 0 1 1 8 2" strokeLinecap="round" />
            <path d="M10.5 2.5l-2-1 1 2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {syncState.syncing ? 'Syncing' : 'Sync now'}
        </button>
      </div>
    </div>
  );
}
