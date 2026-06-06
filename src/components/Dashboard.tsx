import { useState, useEffect } from 'react';
import { useEarthquakeSync } from '../hooks/useEarthquakeSync.js';
import { useEarthquakes } from '../hooks/useEarthquakes.js';
import { useAuth } from '../hooks/useAuth.js';
import { StatsBar } from './StatsBar.js';
import { EarthquakeMap } from './EarthquakeMap.js';
import { EarthquakeTable } from './EarthquakeTable.js';
import { MagnitudeHistogram, DepthScatter } from './MagnitudeChart.js';

export function Dashboard() {
  const { email, signOut } = useAuth();
  const syncState = useEarthquakeSync();

  // Bump this counter to trigger a re-fetch after a sync
  const [refreshTick, setRefreshTick] = useState(0);
  useEffect(() => {
    if (syncState.lastSync) setRefreshTick((t) => t + 1);
  }, [syncState.lastSync]);

  const { earthquakes, loading, error } = useEarthquakes(refreshTick);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* ── Header ── */}
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🌍</span>
          <div>
            <h1 className="text-lg font-bold leading-tight">Seismic Dashboard</h1>
            <p className="text-xs text-slate-500">
              Italy · INGV FDSN API → Rayfin (Microsoft Fabric)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-400 hidden sm:block">{email}</span>
          <button
            onClick={signOut}
            className="rounded-lg bg-slate-700 hover:bg-slate-600 px-3 py-1.5 text-slate-300 transition"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats */}
        <StatsBar
          earthquakes={earthquakes}
          syncState={syncState}
          onSyncNow={syncState.syncNow}
        />

        {/* Error banner */}
        {(error || syncState.error) && (
          <div className="rounded-lg bg-red-900/40 border border-red-700 px-4 py-3 text-sm text-red-300">
            {error || syncState.error}
          </div>
        )}

        {/* Map */}
        {loading ? (
          <div className="rounded-xl bg-slate-800 h-[420px] flex items-center justify-center text-slate-500">
            Loading map…
          </div>
        ) : (
          <EarthquakeMap earthquakes={earthquakes} />
        )}

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MagnitudeHistogram earthquakes={earthquakes} />
          <DepthScatter earthquakes={earthquakes} />
        </div>

        {/* Table */}
        <EarthquakeTable earthquakes={earthquakes} />

        {/* Footer */}
        <footer className="text-center text-xs text-slate-600 pb-4">
          Data source: INGV FDSN Event API ·{' '}
          <a
            href="https://webservices.ingv.it/fdsnws/event/1/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-slate-400"
          >
            webservices.ingv.it
          </a>{' '}
          · Stored &amp; served via{' '}
          <a
            href="https://aka.ms/rayfin"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-slate-400"
          >
            Rayfin
          </a>{' '}
          on Microsoft Fabric
        </footer>
      </main>
    </div>
  );
}
