'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { VehicleTracking } from '@/lib/types';

interface Geofence {
  id: number;
  name: string;
  points: string;
  isActive: boolean;
}

interface Props {
  trackings: VehicleTracking[];
  selected: number | null;
  onSelect: (id: number | null) => void;
  onMapClick?: (lat: number, lng: number) => void;
  isPlacing?: boolean;
  geofences?: Geofence[];
  drawnPoints?: [number, number][];
}

export default function TrackingMap({ trackings, selected, onSelect, onMapClick, isPlacing, geofences = [], drawnPoints = [] }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const clickHandlerRef = useRef<((e: L.LeafletMouseEvent) => void) | null>(null);
  const geofenceLayersRef = useRef<L.Polygon[]>([]);
  const drawnLayerRef = useRef<L.Polygon | null>(null);
  const drawnMarkersRef = useRef<L.CircleMarker[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    mapRef.current = L.map(containerRef.current).setView([12.1348, 15.0557], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(mapRef.current);
    return () => { mapRef.current?.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    if (clickHandlerRef.current) { mapRef.current.off('click', clickHandlerRef.current); clickHandlerRef.current = null; }
    if (isPlacing && onMapClick) {
      const handler = (e: L.LeafletMouseEvent) => onMapClick(e.latlng.lat, e.latlng.lng);
      clickHandlerRef.current = handler;
      mapRef.current.on('click', handler);
      mapRef.current.getContainer().style.cursor = 'crosshair';
    } else {
      mapRef.current.getContainer().style.cursor = '';
    }
  }, [isPlacing, onMapClick]);

  useEffect(() => {
    if (!mapRef.current) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current.clear();

    trackings.forEach((t) => {
      if (!t.latitude || !t.longitude) return;
      const vehicleName = t.vehicle ? `${t.vehicle.model.brand.name} ${t.vehicle.model.name}` : `#${t.vehicleId}`;
      const color = t.isOnline ? '#16a34a' : '#9ca3af';
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background:${color};width:36px;height:36px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;position:relative">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/><path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/><path d="M5 17h-2v-6l2 -5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-4 0h-6m-6 -6h15m-6 0v-5"/></svg>
          ${t.speed && t.speed > 0 ? `<div style="position:absolute;top:-8px;right:-8px;background:#3b82f6;color:white;font-size:9px;font-weight:bold;padding:1px 4px;border-radius:8px;white-space:nowrap">${t.speed}km/h</div>` : ''}
        </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });
      const marker = L.marker([t.latitude, t.longitude], { icon })
        .addTo(mapRef.current!)
        .bindPopup(`<div style="min-width:180px"><strong style="font-size:13px">${vehicleName}</strong><br/><span style="color:#666;font-size:11px">${t.vehicle?.plateNumber || ''}</span><br/><div style="margin-top:6px;display:flex;align-items:center;gap:4px"><div style="width:8px;height:8px;border-radius:50%;background:${t.isOnline ? '#16a34a' : '#9ca3af'}"></div><span style="font-size:11px">${t.isOnline ? 'En ligne' : 'Hors ligne'}</span></div>${t.speed ? `<div style="font-size:11px;margin-top:4px">Vitesse: ${t.speed} km/h</div>` : ''}${t.lastUpdate ? `<div style="font-size:10px;color:#999;margin-top:4px">${new Date(t.lastUpdate).toLocaleString('fr-FR')}</div>` : ''}</div>`);
      marker.on('click', () => onSelect(t.id));
      markersRef.current.set(t.id, marker);
    });

    if (trackings.length > 0) {
      const valid = trackings.filter(t => t.latitude && t.longitude);
      if (valid.length > 0) {
        const bounds = L.latLngBounds(valid.map(t => [t.latitude!, t.longitude!]));
        mapRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
      }
    }
  }, [trackings, onSelect]);

  useEffect(() => {
    if (!mapRef.current) return;
    geofenceLayersRef.current.forEach(l => l.remove());
    geofenceLayersRef.current = [];

    geofences.forEach((gf) => {
      try {
        const pts = JSON.parse(gf.points) as [number, number][];
        const polygon = L.polygon(pts, {
          color: '#9333ea',
          fillColor: '#9333ea',
          fillOpacity: 0.1,
          weight: 2,
          dashArray: '8, 4',
        }).addTo(mapRef.current!);
        polygon.bindTooltip(gf.name, { permanent: false, direction: 'center' });
        geofenceLayersRef.current.push(polygon);
      } catch {}
    });
  }, [geofences]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (drawnLayerRef.current) { drawnLayerRef.current.remove(); drawnLayerRef.current = null; }
    drawnMarkersRef.current.forEach(m => m.remove());
    drawnMarkersRef.current = [];

    if (drawnPoints.length > 0) {
      drawnPoints.forEach((p, i) => {
        const cm = L.circleMarker(p, {
          radius: 6,
          color: '#9333ea',
          fillColor: '#9333ea',
          fillOpacity: 1,
          weight: 2,
        }).addTo(mapRef.current!);
        cm.bindTooltip(`Point ${i + 1}`, { permanent: false });
        drawnMarkersRef.current.push(cm);
      });

      if (drawnPoints.length >= 3) {
        drawnLayerRef.current = L.polygon(drawnPoints, {
          color: '#9333ea',
          fillColor: '#c084fc',
          fillOpacity: 0.2,
          weight: 2,
        }).addTo(mapRef.current);
      }
    }
  }, [drawnPoints]);

  useEffect(() => {
    if (!mapRef.current || !selected) return;
    const marker = markersRef.current.get(selected);
    if (marker) { mapRef.current.setView(marker.getLatLng(), 16, { animate: true }); marker.openPopup(); }
  }, [selected]);

  return <div ref={containerRef} className="w-full h-full" />;
}
