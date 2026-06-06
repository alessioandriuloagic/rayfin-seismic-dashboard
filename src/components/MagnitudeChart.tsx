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
  Legend,
} from 'recharts';
import type { Earthquake } from '../../rayfin/data/Earthquake.js';

interface MagnitudeChartProps {
  earthquakes: Earthquake[];
}

const BINS = [
  { label: '0–1', min: 0, max: 1, color: '#22c55e' },
  { label: '1–2', min: 1, max: 2, color: '#84cc16' },
  { label: '2–3', min: 2, max: 3, color: '#eab308' },
  { label: '3–4', min: 3, max: 4, color: '#f97316' },
  { label: '4–5', min: 4, max: 5, color: '#ef4444' },
  { label: '5+', min: 5, max: Infinity, color: '#7f1d1d' },
];

export function MagnitudeHistogram({ earthquakes }: MagnitudeChartProps) {
  const data = BINS.map((bin) => ({
    ...bin,
    count: earthquakes.filter(
      (e) => e.magnitude >= bin.min && e.magnitude < bin.max,
    ).length,
  }));

  return (
    <div className="rounded-xl bg-slate-800 ring-1 ring-slate-700 p-4 space-y-2">
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
        Events by Magnitude
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={30}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 8,
              color: '#f1f5f9',
            }}
            formatter={(v) => [`${v} events`, 'Count']}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.label} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DepthScatter({ earthquakes }: MagnitudeChartProps) {
  const data = earthquakes
    .slice(0, 200)
    .map((e) => ({ magnitude: e.magnitude, depth: e.depth, place: e.place }));

  return (
    <div className="rounded-xl bg-slate-800 ring-1 ring-slate-700 p-4 space-y-2">
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
        Depth vs Magnitude
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <ScatterChart margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="magnitude"
            name="Magnitude"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            label={{
              value: 'Mag',
              position: 'insideBottomRight',
              fill: '#64748b',
              fontSize: 11,
            }}
          />
          <YAxis
            dataKey="depth"
            name="Depth (km)"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            reversed
            label={{
              value: 'Depth km',
              angle: -90,
              position: 'insideLeft',
              fill: '#64748b',
              fontSize: 11,
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 8,
              color: '#f1f5f9',
            }}
            formatter={(v, name) => [`${v}`, name]}
          />
          <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
          <Scatter name="Event" data={data} fill="#818cf8" opacity={0.7} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
