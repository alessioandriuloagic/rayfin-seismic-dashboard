import { useState, useEffect } from 'react';
import { client } from '../lib/rayfin.js';
import type { Earthquake } from '../../rayfin/data/Earthquake.js';

const ALL_FIELDS = [
  'id',
  'eventId',
  'time',
  'magnitude',
  'magType',
  'place',
  'latitude',
  'longitude',
  'depth',
  'author',
  'quakeType',
] as const;

/**
 * Reads the Earthquake entity from Rayfin, sorted newest-first.
 * Re-fetches whenever `refreshTrigger` changes.
 */
export function useEarthquakes(refreshTrigger: number) {
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    client.data.Earthquake.select(ALL_FIELDS)
      .orderBy({ time: 'desc' })
      .first(500)
      .executePaginated()
      .then((page) => {
        if (!cancelled) {
          setEarthquakes(page.items);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [refreshTrigger]);

  return { earthquakes, loading, error };
}
