import { useState } from 'react';
import type { Earthquake } from '../../rayfin/data/Earthquake.js';

type SortKey = 'time' | 'magnitude' | 'depth' | 'place';
type SortDir = 'asc' | 'desc';

function MagBadge({ mag }: { mag: number }) {
  const cls =
    mag >= 4.5
      ? 'bg-red-500/20 text-red-300 border-red-500/40'
      : mag >= 3.5
      ? 'bg-red-900/40 text-red-400 border-red-700/40'
      : mag >= 2.5
      ? 'bg-orange-900/40 text-orange-400 border-orange-700/40'
      : mag >= 1.5
      ? 'bg-yellow-900/40 text-yellow-400 border-yellow-700/40'
      : 'bg-green-900/40 text-green-400 border-green-700/40';
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold tabular-nums ${cls}`}
    >
      M {mag.toFixed(1)}
    </span>
  );
}

function SortChevron({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <svg
      className={`w-3 h-3 transition-all ${active ? 'text-indigo-400' : 'text-slate-700'}`}
      viewBox="0 0 8 10"
      fill="currentColor"
    >
      {active && dir === 'asc' ? (
        <path d="M4 0L8 5H0L4 0z" />
      ) : active && dir === 'desc' ? (
        <path d="M4 10L0 5h8L4 10z" />
      ) : (
        <>
          <path d="M4 0L8 4H0L4 0z" opacity="0.5" />
          <path d="M4 10L0 6h8L4 10z" opacity="0.5" />
        </>
      )}
    </svg>
  );
}

export function EarthquakeTable({ earthquakes }: { earthquakes: Earthquake[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('time');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [search, setSearch] = useState('');

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  const rows = earthquakes
    .filter(
      (e) => !search || e.place.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'time') cmp = a.time.localeCompare(b.time);
      else if (sortKey === 'magnitude') cmp = a.magnitude - b.magnitude;
      else if (sortKey === 'depth') cmp = a.depth - b.depth;
      else cmp = a.place.localeCompare(b.place);
      return sortDir === 'asc' ? cmp : -cmp;
    })
    .slice(0, 150);

  const cols: { key: SortKey; label: string }[] = [
    { key: 'time', label: 'Time (UTC)' },
    { key: 'magnitude', label: 'Mag' },
    { key: 'place', label: 'Location' },
    { key: 'depth', label: 'Depth km' },
  ];

  return (
    <div className="rounded-xl bg-slate-800/70 border border-slate-700/50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/60 gap-3 bg-slate-800/50">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Events</h3>
          <p className="text-xs text-slate-600 mt-0.5">{rows.length} rows</p>
        </div>
        <div className="relative">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="7" cy="7" r="5" />
            <path d="M11 11l3 3" strokeLinecap="round" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search location..."
            className="rounded-lg bg-slate-900/50 border border-slate-700/60 text-sm text-slate-200 pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 w-48 placeholder:text-slate-700 transition-all"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/50 bg-slate-900/30">
              {cols.map(({ key, label }) => (
                <th
                  key={key}
                  onClick={() => toggleSort(key)}
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-300 select-none transition-colors"
                >
                  <span className="inline-flex items-center gap-1.5">
                    {label}
                    <SortChevron active={sortKey === key} dir={sortDir} />
                  </span>
                </th>
              ))}
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Type
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {rows.map((eq, i) => (
              <tr
                key={eq.id}
                className="hover:bg-slate-700/20 transition-colors animate-fade-in"
                style={{ animationDelay: `${Math.min(i * 8, 160)}ms` }}
              >
                <td className="px-4 py-2.5 text-slate-400 font-mono text-xs whitespace-nowrap">
                  {new Date(eq.time).toLocaleString('it-IT', {
                    dateStyle: 'short',
                    timeStyle: 'medium',
                  })}
                </td>
                <td className="px-4 py-2.5">
                  <MagBadge mag={eq.magnitude} />
                </td>
                <td className="px-4 py-2.5 text-slate-300 max-w-[220px] truncate">
                  {eq.place}
                </td>
                <td className="px-4 py-2.5 text-slate-400 tabular-nums">
                  {eq.depth.toFixed(1)}
                </td>
                <td className="px-4 py-2.5 text-slate-500 text-xs uppercase tracking-wider">
                  {eq.magType}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="text-center py-12 text-slate-600 text-sm">
            No events match the current filters
          </div>
        )}
      </div>
    </div>
  );
}
