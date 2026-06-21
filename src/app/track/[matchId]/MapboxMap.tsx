'use client';

import { useEffect, useRef } from 'react';

interface Point {
  latitude: number;
  longitude: number;
  recorded_at: string;
}

interface Props {
  points: Point[];
  fromCity?: string;
  toCity?: string;
}

export default function MapboxMap({ points, fromCity, toCity }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;

    Promise.all([
      import('leaflet'),
      import('leaflet/dist/leaflet.css' as any).catch(() => {}),
    ]).then(([L]) => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      const latest = points.length > 0 ? points[points.length - 1] : null;
      const center: [number, number] = latest
        ? [latest.latitude, latest.longitude]
        : [20, 0];

      const map = L.map(containerRef.current!, {
        center,
        zoom: latest ? 9 : 2,
        zoomControl: true,
        attributionControl: false,
      });

      mapRef.current = map;

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(map);

      if (points.length > 0) {
        const latlngs: [number, number][] = points.map((p) => [p.latitude, p.longitude]);

        L.polyline(latlngs, {
          color: '#3b82f6',
          weight: 3,
          opacity: 0.85,
        }).addTo(map);

        // Departure pin
        const first = points[0];
        L.circleMarker([first.latitude, first.longitude], {
          radius: 7,
          fillColor: '#3b82f6',
          color: '#fff',
          weight: 2,
          fillOpacity: 1,
        })
          .bindPopup(fromCity || 'Departure')
          .addTo(map);

        // Package pin at latest position
        const pkg = L.divIcon({
          html: '<div style="font-size:22px;line-height:1;filter:drop-shadow(0 2px 6px rgba(59,130,246,0.6))">📦</div>',
          className: '',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        L.marker([latest!.latitude, latest!.longitude], { icon: pkg })
          .bindPopup('Package — last known location')
          .addTo(map);

        map.fitBounds(L.latLngBounds(latlngs), { padding: [30, 30] });
      }
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update route and marker when points change after initial load
  useEffect(() => {
    const map = mapRef.current;
    if (!map || points.length === 0) return;

    const latest = points[points.length - 1];
    map.setView([latest.latitude, latest.longitude], map.getZoom(), { animate: true });
  }, [points]);

  return (
    <div
      ref={containerRef}
      className="w-full h-[280px] rounded-2xl overflow-hidden bg-slate-900"
    />
  );
}
