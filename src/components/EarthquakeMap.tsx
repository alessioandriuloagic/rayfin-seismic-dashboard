import { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { LeafletMouseEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Earthquake } from '../../rayfin/data/Earthquake.js';
import type { BBox } from './FilterPanel.js';

interface EarthquakeMapProps {
  earthquakes: Earthquake[];
  allEarthquakes: Earthquake[];
  bbox: BBox | null;
  onBboxChange: (bbox: BBox | null) => void;
}

function magnitudeStyle(mag: number): { color: string; radius: number } {
  if (mag < 1.5) return { color: '#22c55e', radius: 5 };
  if (mag < 2.5) return { color: '#eab308', radius: 7 };
  if (mag < 3.5) return { color: '#f97316', radius: 10 };
  if (mag < 4.5) return { color: '#ef4444', radius: 14 };
  return { color: '#dc2626', radius: 20 };
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('it-IT', {
    dateStyle: 'short',
    timeStyle: 'medium',
  });
}

function BBoxDrawer({
  drawMode,
  bbox,
  onBboxChange,
}: {
  drawMode: boolean;
  bbox: BBox | null;
  onBboxChange: (b: BBox | null) => void;
}) {
  const map = useMap();
  const startRef = useRef<L.LatLng | null>(null);
  const rectRef = useRef<L.Rectangle | null>(null);
  const isDrawingRef = useRef(false);
  const onBboxChangeRef = useRef(onBboxChange);
  useEffect(() => {
    onBboxChangeRef.current = onBboxChange;
  }, [onBboxChange]);

  useEffect(() => {
    if (!drawMode) return;

    const onMouseDown = (e: LeafletMouseEvent) => {
      isDrawingRef.current = true;
      startRef.current = e.latlng;
      map.dragging.disable();
      if (rectRef.current) {
        map.removeLayer(rectRef.current);
        rectRef.current = null;
      }
    };

    const onMouseMove = (e: LeafletMouseEvent) => {
      if (!isDrawingRef.current || !startRef.current) return;
      const bounds = L.latLngBounds(startRef.current, e.latlng);
      if (rectRef.current) {
        rectRef.current.setBounds(bounds);
      } else {
        rectRef.current = L.rectangle(bounds, {
          color: '#818cf8',
          weight: 2,
          dashArray: '6 4',
          fillColor: '#6366f1',
          fillOpacity: 0.08,
        }).addTo(map);
      }
    };

    const onMouseUp = (e: LeafletMouseEvent) => {
      if (!isDrawingRef.current || !startRef.current) return;
      isDrawingRef.current = false;
      map.dragging.enable();
      const bounds = L.latLngBounds(startRef.current, e.latlng);
      const area =
        Math.abs(bounds.getNorth() - bounds.getSouth()) *
        Math.abs(bounds.getEast() - bounds.getWest());
      if (area > 0.005) {
        onBboxChangeRef.current([
          bounds.getSouth(),
          bounds.getWest(),
          bounds.getNorth(),
          bounds.getEast(),
        ]);
      } else if (rectRef.current) {
        map.removeLayer(rectRef.current);
        rectRef.current = null;
      }
      startRef.current = null;
    };

    map.on('mousedown', onMouseDown);
    map.on('mousemove', onMouseMove);
    map.on('mouseup', onMouseUp);

    return () => {
      map.off('mousedown', onMouseDown);
      map.off('mousemove', onMouseMove);
      map.off('mouseup', onMouseUp);
      map.dragging.enable();
    };
  }, [drawMode, map]);

  useEffect(() => {
    if (!bbox && rectRef.current) {
      map.removeLayer(rectRef.current);
      rectRef.current = null;
    }
  }, [bbox, map]);

  return null;
}

export function EarthquakeMap({
  earthquakes,
  allEarthquakes,
  bbox,
  onBboxChange,
}: EarthquakeMapProps) {
  const [drawMode, setDrawMode] = useState(false);
  const filteredIds = new Set(earthquakes.map((e) => e.id));

  const handleBboxChange = useCallback(
    (b: BBox | null) => {
      onBboxChange(b);
      setDrawMode(false);
    },
    [onBboxChange],
  );

  function toggleDraw() {
    if (drawMode) {
      setDrawMode(false);
    } else {
      onBboxChange(null);
      setDrawMode(true);
    }
  }

  return (
    <div
      className={`relative rounded-xl overflow-hidden border border-slate-700/80 h-[440px]${
        drawMode ? ' map-draw-mode' : ''
      }`}
    >
      <MapContainer
        center={[42.5, 12.5]}
        zoom={6}
        className="h-full w-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <BBoxDrawer drawMode={drawMode} bbox={bbox} onBboxChange={handleBboxChange} />
        {allEarthquakes.map((eq) => {
          const active = filteredIds.has(eq.id);
          const { color, radius } = magnitudeStyle(eq.magnitude);
          return (
            <CircleMarker
              key={eq.id}
              center={[eq.latitude, eq.longitude]}
              radius={active ? radius : 3}
              pathOptions={{
                color: active ? color : '#475569',
                fillColor: active ? color : '#334155',
                fillOpacity: active ? 0.75 : 0.2,
                weight: active ? 1.5 : 0.5,
              }}
            >
              {active && (
                <Popup>
                  <div className="space-y-1">
                    <p className="font-bold text-base leading-tight">
                      M {eq.magnitude.toFixed(1)}
                      <span className="ml-1.5 text-xs font-normal opacity-60">
                        {eq.magType}
                      </span>
                    </p>
                    <p className="text-sm">{eq.place}</p>
                    <p className="text-xs opacity-60">{formatTime(eq.time)}</p>
                    <p className="text-xs opacity-60">Depth: {eq.depth.toFixed(1)} km</p>
                  </div>
                </Popup>
              )}
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Map controls */}
      <div className="absolute top-3 right-3 z-[1000] flex gap-2">
        {bbox && (
          <button
            onClick={() => {
              onBboxChange(null);
              setDrawMode(false);
            }}
            className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-sm border border-violet-500/50 text-violet-300 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-800/90 transition-all"
          >
            <svg
              className="w-3 h-3"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M1 1l10 10M11 1L1 11" strokeLinecap="round" />
            </svg>
            Clear region
          </button>
        )}
        <button
          onClick={toggleDraw}
          className={`flex items-center gap-1.5 backdrop-blur-sm text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
            drawMode
              ? 'bg-indigo-600 text-white border border-indigo-500 shadow-lg shadow-indigo-500/30'
              : 'bg-slate-900/90 border border-slate-600/80 text-slate-300 hover:border-indigo-500/60 hover:text-indigo-300'
          }`}
        >
          <svg
            className="w-3 h-3"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="1.5" y="1.5" width="9" height="9" rx="1" strokeDasharray="2.5 2" />
          </svg>
          {drawMode ? 'Drawing…' : 'Select region'}
        </button>
      </div>

      {/* Draw hint */}
      {drawMode && (
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/90 backdrop-blur-sm border border-indigo-500/30 text-indigo-300 text-xs px-3 py-1.5 rounded-full pointer-events-none">
          Click and drag to select a region
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/85 backdrop-blur-sm rounded-xl px-3 py-2.5 text-xs text-slate-400 space-y-1.5 pointer-events-none border border-slate-700/50">
        {[
          { label: '< 1.5', color: '#22c55e' },
          { label: '1.5 – 2.5', color: '#eab308' },
          { label: '2.5 – 3.5', color: '#f97316' },
          { label: '3.5 – 4.5', color: '#ef4444' },
          { label: '≥ 4.5', color: '#dc2626' },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
