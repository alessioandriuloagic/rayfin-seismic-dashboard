import type { Earthquake } from '../../rayfin/data/Earthquake.js';

export type BBox = [number, number, number, number]; // [minLat, minLng, maxLat, maxLng]

export interface FilterState {
  minMag: number;
  hoursBack: number;
  bbox: BBox | null;
  selectedBin: string | null;
}

export const DEFAULT_FILTERS: FilterState = {
  minMag: 0,
  hoursBack: 24,
  bbox: null,
  selectedBin: null,
};

const TIME_OPTIONS = [
  { label: '6h', value: 6 },
  { label: '12h', value: 12 },
  { label: '24h', value: 24 },
  { label: '48h', value: 48 },
  { label: '7d', value: 168 },
];

const MAX_MAG = 6;

interface FilterPanelProps {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  earthquakeCount: number;
  totalCount: number;
}

const BIN_MAP: Record<string, [number, number]> = {
  '0–1': [0, 1],
  '1–2': [1, 2],
  '2–3': [2, 3],
  '3–4': [3, 4],
  '4–5': [4, 5],
  '5+': [5, Infinity],
};

export function applyFilters(
  earthquakes: Earthquake[],
  filters: FilterState,
): Earthquake[] {
  const cutoff = Date.now() - filters.hoursBack * 3_600_000;
  return earthquakes.filter((e) => {
    if (e.magnitude < filters.minMag) return false;
    if (new Date(e.time).getTime() < cutoff) return false;
    if (filters.bbox) {
      const [minLat, minLng, maxLat, maxLng] = filters.bbox;
      if (e.latitude < minLat || e.latitude > maxLat) return false;
      if (e.longitude < minLng || e.longitude > maxLng) return false;
    }
    if (filters.selectedBin) {
      const range = BIN_MAP[filters.selectedBin];
      if (range && (e.magnitude < range[0] || e.magnitude >= range[1])) return false;
    }
    return true;
  });
}

export function FilterPanel({
  filters,
  onChange,
  earthquakeCount,
  totalCount,
}: FilterPanelProps) {
  const isFiltered =
    filters.minMag > 0 ||
    filters.hoursBack !== 24 ||
    filters.bbox !== null ||
    filters.selectedBin !== null;

  const pct = (filters.minMag / MAX_MAG) * 100;

  return (
    <div className="rounded-xl bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-3">
      {/* Time window */}
      <div className="flex items-center gap-2.5">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap">
          Window
        </span>
        <div className="flex rounded-lg overflow-hidden border border-slate-700/80">
          {TIME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange({ ...filters, hoursBack: opt.value })}
              className={`px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                filters.hoursBack === opt.value
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/80'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Min magnitude slider */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap">
          Min mag
        </span>
        <input
          type="range"
          min={0}
          max={MAX_MAG}
          step={0.5}
          value={filters.minMag}
          onChange={(e) => onChange({ ...filters, minMag: Number(e.target.value) })}
          style={{ '--range-pct': `${pct}%` } as React.CSSProperties}
          className="w-28"
        />
        <span
          className={`text-sm font-bold tabular-nums w-8 text-center transition-colors ${
            filters.minMag >= 4
              ? 'text-red-400'
              : filters.minMag >= 2
              ? 'text-amber-400'
              : 'text-slate-300'
          }`}
        >
          {filters.minMag === 0 ? 'All' : `M${filters.minMag}`}
        </span>
      </div>

      {/* Active filter chips */}
      <div className="flex items-center gap-2">
        {filters.bbox && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-600/20 border border-violet-500/40 text-violet-300 text-xs px-2.5 py-1 leading-none">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
            Region selected
            <button
              onClick={() => onChange({ ...filters, bbox: null })}
              className="ml-0.5 hover:text-white transition-colors leading-none"
              aria-label="Clear region"
            >
              ×
            </button>
          </span>
        )}
        {filters.selectedBin && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xs px-2.5 py-1 leading-none">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
            M {filters.selectedBin}
            <button
              onClick={() => onChange({ ...filters, selectedBin: null })}
              className="ml-0.5 hover:text-white transition-colors leading-none"
              aria-label="Clear magnitude bin"
            >
              ×
            </button>
          </span>
        )}
      </div>

      {/* Result count + reset */}
      <div className="ml-auto flex items-center gap-3">
        <span className="text-xs text-slate-500">
          <span className="text-slate-200 font-semibold tabular-nums">
            {earthquakeCount}
          </span>
          {isFiltered && (
            <span className="text-slate-700"> / {totalCount}</span>
          )}{' '}
          events
        </span>
        {isFiltered && (
          <button
            onClick={() => onChange({ ...DEFAULT_FILTERS })}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-semibold"
          >
            Reset all
          </button>
        )}
      </div>
    </div>
  );
}
