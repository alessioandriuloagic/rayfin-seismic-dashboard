import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { Earthquake } from '../../rayfin/data/Earthquake.js';

interface EarthquakeMapProps {
  earthquakes: Earthquake[];
}

/** Returns a colour and radius based on magnitude */
function magnitudeStyle(mag: number): { color: string; radius: number } {
  if (mag < 1.5) return { color: '#22c55e', radius: 5 };   // green
  if (mag < 2.5) return { color: '#eab308', radius: 7 };   // yellow
  if (mag < 3.5) return { color: '#f97316', radius: 10 };  // orange
  if (mag < 4.5) return { color: '#ef4444', radius: 14 };  // red
  return { color: '#7f1d1d', radius: 20 };                  // dark red
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('it-IT', {
    dateStyle: 'short',
    timeStyle: 'medium',
  });
}

export function EarthquakeMap({ earthquakes }: EarthquakeMapProps) {
  // Leaflet CSS fix for marker icons in Vite builds
  useEffect(() => {
    // nothing – icons handled via CircleMarker (no default icon needed)
  }, []);

  return (
    <div className="rounded-xl overflow-hidden ring-1 ring-slate-700 h-[420px]">
      <MapContainer
        center={[42.5, 12.5]}
        zoom={6}
        className="h-full w-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {earthquakes.map((eq) => {
          const { color, radius } = magnitudeStyle(eq.magnitude);
          return (
            <CircleMarker
              key={eq.id}
              center={[eq.latitude, eq.longitude]}
              radius={radius}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: 0.65,
                weight: 1,
              }}
            >
              <Popup>
                <div className="text-sm space-y-1 min-w-[180px]">
                  <p className="font-bold text-base">M {eq.magnitude.toFixed(1)}</p>
                  <p>{eq.place}</p>
                  <p className="text-gray-500">{formatTime(eq.time)}</p>
                  <p className="text-gray-500">Depth: {eq.depth.toFixed(1)} km</p>
                  <p className="text-gray-500">Type: {eq.magType}</p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-6 left-6 z-[1000] bg-slate-900/80 rounded-lg px-3 py-2 text-xs text-slate-300 space-y-1 pointer-events-none">
        {[
          { label: '< 1.5', color: '#22c55e' },
          { label: '1.5 – 2.5', color: '#eab308' },
          { label: '2.5 – 3.5', color: '#f97316' },
          { label: '3.5 – 4.5', color: '#ef4444' },
          { label: '≥ 4.5', color: '#7f1d1d' },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
