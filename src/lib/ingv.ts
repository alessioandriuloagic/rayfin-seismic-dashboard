/** Normalised earthquake record (maps from INGV GeoJSON Feature) */
export interface IngvEarthquake {
  eventId: number;
  time: string;
  magnitude: number;
  magType: string;
  place: string;
  latitude: number;
  longitude: number;
  depth: number;
  author: string;
  magAuthor: string;
  quakeType: string;
}

const BASE_URL = 'https://webservices.ingv.it/fdsnws/event/1/query';

/**
 * Fetch recent earthquakes from the INGV FDSN API.
 *
 * @param hours  - look-back window in hours (default 24)
 * @param minMag - minimum magnitude filter (default 0)
 */
export async function fetchRecentEarthquakes(
  hours = 24,
  minMag = 0,
): Promise<IngvEarthquake[]> {
  const startTime = new Date(Date.now() - hours * 60 * 60 * 1000)
    .toISOString()
    .replace('T', ' ')
    .split('.')[0];

  const params = new URLSearchParams({
    format: 'geojson',
    limit: '300',
    minmag: String(minMag),
    starttime: startTime,
    orderby: 'time-asc',
  });

  const res = await fetch(`${BASE_URL}?${params}`);
  if (!res.ok) {
    throw new Error(`INGV API responded with HTTP ${res.status}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const geojson: { features: any[] } = await res.json();

  return geojson.features.map((f) => ({
    eventId: f.properties.eventId as number,
    time: f.properties.time as string,
    magnitude: f.properties.mag as number,
    magType: (f.properties.magType ?? '') as string,
    place: (f.properties.place ?? '') as string,
    latitude: f.geometry.coordinates[1] as number,
    longitude: f.geometry.coordinates[0] as number,
    depth: f.geometry.coordinates[2] as number,
    author: (f.properties.author ?? '') as string,
    magAuthor: (f.properties.magAuthor ?? '') as string,
    quakeType: (f.properties.type ?? 'earthquake') as string,
  }));
}
