import { useState } from 'react';
import type { Earthquake } from '../../rayfin/data/Earthquake.js';

interface EarthquakeTableProps {
  earthquakes: Earthquake[];
}

type SortKey = 'time' | 'magnitude' | 'depth' | 'place';
type SortDir = 'asc' | 'desc';

function magnitudeBadge(mag: number) {
  if (mag < 1.5) return 'bg-green-900/50 text-green-400';
  if (mag < 2.5) return 'bg-yellow-900/50 text-yellow-400';
  if (mag < 3.5) return 'bg-orange-900/50 text-orange-400';
  if (mag < 4.5) return 'bg-red-900/50 text-red-400';
  return 'bg-red-950 text-red-300 font-bold';
}

export function EarthquakeTable({ earthquakes }: EarthquakeTableProps) {
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

  const filtered = earthquakes
    .filter((e) =>
      search
        ? e.place.toLowerCase().includes(search.toLowerCase()) ||
          String(e.magnitude).includes(search)
        : true,
    )
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'time') cmp = a.time.localeCompare(b.time);
      else if (sortKey === 'magnitude') cmp = a.magnitude - b.magnitude;
      else if (sortKey === 'depth') cmp = a.depth - b.depth;
      else if (sortKey === 'place') cmp = a.place.localeCompare(b.place);
      return sortDir === 'asc' ? cmp : -cmp;
    })
    .slice(0, 100);

  const arrow = (key: SortKey) =>
    sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  return (
    <div className="rounded-xl bg-slate-800 ring-1 ring-slate-700 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
          Recent Events
        </h3>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by place…"
          className="rounded-lg bg-slate-700 border border-slate-600 text-sm text-white px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 uppercase border-b border-slate-700">
              {(
                [
                  ['time', 'Time (UTC)'],
                  ['magnitude', 'Mag'],
                  ['place', 'Location'],
                  ['depth', 'Depth km'],
                ] as [SortKey, string][]
              ).map(([key, label]) => (
                <th
                  key={key}
                  onClick={() => toggleSort(key)}
                  className="px-4 py-2 cursor-pointer hover:text-slate-300 select-none"
                >
                  {label}
                  {arrow(key)}
                </th>
              ))}
              <th className="px-4 py-2">Type</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((eq) => (
              <tr
                key={eq.id}
                className="border-b border-slate-700/50 hover:bg-slate-700/30 transition"
              >
                <td className="px-4 py-2 text-slate-400 whitespace-nowrap font-mono text-xs">
                  {new Date(eq.time).toLocaleString('it-IT', {
                    dateStyle: 'short',
                    timeStyle: 'medium',
                  })}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${magnitudeBadge(eq.magnitude)}`}
                  >
                    M {eq.magnitude.toFixed(1)}
                  </span>
                </td>
                <td className="px-4 py-2 text-slate-300 max-w-xs truncate">
                  {eq.place}
                </td>
                <td className="px-4 py-2 text-slate-400">
                  {eq.depth.toFixed(1)}
                </td>
                <td className="px-4 py-2 text-slate-500 text-xs uppercase">
                  {eq.magType}
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No events match your filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-2 text-xs text-slate-500 border-t border-slate-700">
        Showing {filtered.length} of {earthquakes.length} events
      </div>
    </div>
  );
}
