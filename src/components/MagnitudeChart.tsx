import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ScatterChart,
  Scatter,
  CartesianGrid,
} from 'recharts';
import type { Earthquake } from '../../rayfin/data/Earthquake.js';

const BINS = [
  { label: '0–1', min: 0, max: 1, color: '#22c55e' },
  { label: '1–2', min: 1, max: 2, color: '#84cc16' },
  { label: '2–3', min: 2, max: 3, color: '#eab308' },
  { label: '3–4', min: 3, max: 4, color: '#f97316' },
  { label: '4–5', min: 4, max: 5, color: '#ef4444' },
  { label: '5+', min: 5, max: Infinity, color: '#dc2626' },
];

const tooltipStyle = {
  backgroundColor: '#0f172a',
  border: '1px solid #1e293b',
  borderRadius: 8,
  color: '#f1f5f9',
  fontSize: 12,
  boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
};

interface HistoProps {
  earthquakes: Earthquake[];
  selectedBin: string | null;
  onBinClick: (bin: string | null) => void;
}

export function MagnitudeHistogram({ earthquakes, selectedBin, onBinClick }: HistoProps) {
  const data = BINS.map((bin) => ({
    ...bin,
    count: earthquakes.filter(
      (e) => e.magnitude >= bin.min && e.magnitude < bin.max,
    ).length,
  }));

  return (
    <div className="rounded-xl bg-slate-800/70 border border-slate-700/50 p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Events by Magnitude</h3>
          <p className="text-xs text-slate-600 mt-0.5">Click a bar to filter</p>
        </div>
        {selectedBin && (
          <button
            onClick={() => onBinClick(null)}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-semibold"
          >
            Clear
          </button>
        )}
      </div>
      <ResponsiveContainer width="100%" height={195}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
          <XAxis
            dataKey="label"
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v) => [`${v} events`, '']}
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          />
          <Bar
            dataKey="count"
            radius={[4, 4, 0, 0]}
            cursor="pointer"
            onClick={(d: { label: string }) =>
              onBinClick(selectedBin === d.label ? null : d.label)
            }
          >
            {data.map((entry) => (
              <Cell
                key={entry.label}
                fill={entry.color}
                opacity={!selectedBin || selectedBin === entry.label ? 1 : 0.2}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DepthScatter({ earthquakes }: { earthquakes: Earthquake[] }) {
  const data = earthquakes
    .slice(0, 300)
    .map((e) => ({ magnitude: e.magnitude, depth: e.depth }));

  return (
    <div className="rounded-xl bg-slate-800/70 border border-slate-700/50 p-4 space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-slate-200">Depth vs Magnitude</h3>
        <p className="text-xs text-slate-600 mt-0.5">Hypocentral depth · km (inverted)</p>
      </div>
      <ResponsiveContainer width="100%" height={195}>
        <ScatterChart margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="magnitude"
            name="Magnitude"
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            label={{
              value: 'Mag',
              position: 'insideBottomRight',
              fill: '#475569',
              fontSize: 10,
            }}
          />
          <YAxis
            dataKey="depth"
            name="Depth (km)"
            reversed
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={30}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v, n) => [`${v}`, n]}
            cursor={{ strokeDasharray: '3 3', stroke: '#334155' }}
          />
          <Scatter data={data} fill="#818cf8" opacity={0.6} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
