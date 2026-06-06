import { useState, useEffect, useCallback, useRef } from 'react';
import { client } from '../lib/rayfin.js';
import { fetchRecentEarthquakes } from '../lib/ingv.js';

export interface SyncState {
  lastSync: Date | null;
  syncing: boolean;
  error: string | null;
  newCount: number;
  totalSynced: number;
}

/** How often the hook polls INGV and syncs to Rayfin (ms) */
const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Polls the INGV FDSN API every 5 minutes and writes new seismic events
 * into the Rayfin Earthquake entity. Deduplication is based on eventId.
 *
 * @returns sync state + an imperative `syncNow()` trigger
 */
export function useEarthquakeSync(): SyncState & { syncNow: () => void } {
  const [state, setState] = useState<SyncState>({
    lastSync: null,
    syncing: false,
    error: null,
    newCount: 0,
    totalSynced: 0,
  });

  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const sync = useCallback(async () => {
    setState((s) => ({ ...s, syncing: true, error: null }));
    try {
      // 1. Fetch last 24 h of events from INGV
      const incoming = await fetchRecentEarthquakes(24, 0);

      // 2. Retrieve all stored eventIds in a single lightweight query
      const existing = await client.data.Earthquake.select(['eventId']).execute();
      const existingIds = new Set(existing.map((e) => e.eventId));

      // 3. Keep only events not yet in Rayfin
      const newEvents = incoming.filter((e) => !existingIds.has(e.eventId));

      // 4. Insert new events sequentially to avoid overwhelming the backend
      for (const ev of newEvents) {
        await client.data.Earthquake.create({
          eventId: ev.eventId,
          time: ev.time,
          magnitude: ev.magnitude,
          magType: ev.magType,
          place: ev.place,
          latitude: ev.latitude,
          longitude: ev.longitude,
          depth: ev.depth,
          author: ev.author,
          magAuthor: ev.magAuthor || undefined,
          quakeType: ev.quakeType,
        });
      }

      setState({
        lastSync: new Date(),
        syncing: false,
        error: null,
        newCount: newEvents.length,
        totalSynced: existing.length + newEvents.length,
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        syncing: false,
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  }, []);

  useEffect(() => {
    sync();
    timerRef.current = setInterval(sync, POLL_INTERVAL_MS);
    return () => clearInterval(timerRef.current);
  }, [sync]);

  return { ...state, syncNow: sync };
}
