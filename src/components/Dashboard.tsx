import { useState, useEffect, useCallback } from 'react';
import { useEarthquakeSync } from '../hooks/useEarthquakeSync.js';
import { useEarthquakes } from '../hooks/useEarthquakes.js';
import { useAuth } from '../hooks/useAuth.js';
import { StatsBar } from './StatsBar.js';
import { EarthquakeMap } from './EarthquakeMap.js';
import { EarthquakeTable } from './EarthquakeTable.js';
import { MagnitudeHistogram, DepthScatter } from './MagnitudeChart.js';
import { FilterPanel, DEFAULT_FILTERS, applyFilters } from './FilterPanel.js';
import type { FilterState, BBox } from './FilterPanel.js';

export function Dashboard() {
  const { email, signOut } = useAuth();
  const syncState = useEarthquakeSync();

  const [refreshTick, setRefreshTick] = useState(0);
  useEffect(() => {
    if (syncState.lastSync) setRefreshTick((t) => t + 1);
  }, [syncState.lastSync]);

  const { earthquakes, loading, error } = useEarthquakes(refreshTick);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const handleBboxChange = useCallback((bbox: BBox | null) => {
    setFilters((f) => ({ ...f, bbox }));
  }, []);

  const filtered = applyFilters(earthquakes, filters);

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-white">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#0b0f1a]/80 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <svg
              className="w-4 h-4 text-indigo-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M2 12h2l2-6 3 12 3-8 2 4 2-2h6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight text-white tracking-tight">
              Seismic Dashboard
            </h1>
            <p className="text-xs text-slate-500">
              Italy · INGV FDSN API → Rayfin · Microsoft Fabric
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 hidden sm:block">{email}</span>
          <button
            onClick={signOut}
            className="rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-all"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-5 space-y-4">
        {/* Filter panel */}
        <FilterPanel
          filters={filters}
          onChange={setFilters}
          earthquakeCount={filtered.length}
          totalCount={earthquakes.length}
        />

        {/* Stats */}
        <StatsBar
          earthquakes={filtered}
          syncState={syncState}
          onSyncNow={syncState.syncNow}
        />

        {/* Error banner */}
        {(error || syncState.error) && (
          <div className="rounded-xl bg-red-950/40 border border-red-800/60 px-4 py-3 text-sm text-red-300">
            {error || syncState.error}
          </div>
        )}

        {/* Map + Charts side by side on large screens */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          <div className="xl:col-span-3">
            {loading ? (
              <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 h-[440px] flex items-center justify-center">
                <div className="flex items-center gap-2.5 text-slate-500 text-sm">
                  <svg
                    className="w-4 h-4 animate-spin"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M14 8A6 6 0 1 1 8 2" strokeLinecap="round" />
                  </svg>
                  Loading map
                </div>
              </div>
            ) : (
              <EarthquakeMap
                earthquakes={filtered}
                allEarthquakes={earthquakes}
                bbox={filters.bbox}
                onBboxChange={handleBboxChange}
              />
            )}
          </div>

          <div className="xl:col-span-2 flex flex-col gap-4">
            <MagnitudeHistogram
              earthquakes={filtered}
              selectedBin={filters.selectedBin}
              onBinClick={(bin) => setFilters((f) => ({ ...f, selectedBin: bin }))}
            />
            <DepthScatter earthquakes={filtered} />
          </div>
        </div>

        {/* Table */}
        <EarthquakeTable earthquakes={filtered} />

        {/* Footer */}
        <footer className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-700 py-4 border-t border-slate-800/60">
          <span>Data: INGV FDSN Event API</span>
          <span>·</span>
          <a
            href="https://webservices.ingv.it/fdsnws/event/1/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-500 transition-colors underline underline-offset-2"
          >
            webservices.ingv.it
          </a>
          <span>·</span>
          <a
            href="https://aka.ms/rayfin"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-500 transition-colors underline underline-offset-2"
          >
            Rayfin
          </a>
          <span>·</span>
          <span>Microsoft Fabric</span>
        </footer>
      </main>
    </div>
  );
}
