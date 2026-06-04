'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon paths in Next.js
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const startIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

interface MapPoint {
  lat: number; lng: number; label: string; type: string;
}

export default function MapComponent({ points }: { points: MapPoint[] }) {
  if (!points.length) return null;

  const center: [number, number] = [points[points.length - 1].lat, points[points.length - 1].lng];
  const polyline: [number, number][] = points.map(p => [p.lat, p.lng]);

  return (
    <MapContainer
      center={center}
      zoom={10}
      style={{ height: '280px', width: '100%', background: '#0f172a' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {points.length > 1 && (
        <Polyline positions={polyline} pathOptions={{ color: '#10b981', weight: 3, opacity: 0.7, dashArray: '6 4' }} />
      )}
      {points.map((p, i) => (
        <Marker key={i} position={[p.lat, p.lng]} icon={startIcon}>
          <Popup>
            <div style={{ fontFamily: 'system-ui', minWidth: 160 }}>
              <strong>{p.type.replace('_', ' ')}</strong>
              <br /><small style={{ color: '#64748b' }}>{p.label}</small>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
