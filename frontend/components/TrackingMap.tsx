'use client';

import { useEffect, useRef, useState } from 'react';
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
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    mapRef.current = L.map(containerRef.current, {
      center: [12.1348, 15.0557],
      zoom: 13,
      zoomControl: false,
      scrollWheelZoom: true,
      dragging: true,
      doubleClickZoom: true,
      touchZoom: true,
    });

    L.control.zoom({ position: 'topright' }).addTo(mapRef.current);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(mapRef.current);

    setTimeout(() => {
      mapRef.current?.invalidateSize();
      setMapReady(true);
    }, 300);

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
    if (!mapRef.current || !mapReady) return;
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
        .bindPopup(`<div style="min-width:180px"><strong>${vehicleName}</strong><br/><span style="color:#666;font-size:11px">${t.vehicle?.plateNumber || ''}</span><br/><div style="margin-top:6px;display:flex;align-items:center;gap:4px"><div style="width:8px;height:8px;border-radius:50%;background:${t.isOnline ? '#16a34a' : '#9ca3af'}"></div><span style="font-size:11px">${t.isOnline ? 'En ligne' : 'Hors ligne'}</span></div>${t.speed ? `<div style="font-size:11px;margin-top:4px">Vitesse: ${t.speed} km/h</div>` : ''}${t.lastUpdate ? `<div style="font-size:10px;color:#999;margin-top:4px">${new Date(t.lastUpdate).toLocaleString('fr-FR')}</div>` : ''}</div>`);
      marker.on('click', () => onSelect(t.id));
      markersRef.current.set(t.id, marker);
    });

    if (trackings.length > 0) {
      const valid = trackings.filter(t => t.latitude && t.longitude);
      if (valid.length === 1) {
        mapRef.current.setView([valid[0].latitude!, valid[0].longitude!], 14, { animate: true });
      } else if (valid.length > 1) {
        const bounds = L.latLngBounds(valid.map(t => [t.latitude!, t.longitude!]));
        mapRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
      }
    }
  }, [trackings, onSelect, mapReady]);

  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
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
        polygon.bindTooltip(gf.name, { permanent: true, direction: 'center', className: 'geofence-label' });
        geofenceLayersRef.current.push(polygon);
      } catch {}
    });
  }, [geofences, mapReady]);

  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    if (drawnLayerRef.current) { drawnLayerRef.current.remove(); drawnLayerRef.current = null; }
    drawnMarkersRef.current.forEach(m => m.remove());
    drawnMarkersRef.current = [];

    if (drawnPoints.length > 0) {
      drawnPoints.forEach((p, i) => {
        const cm = L.circleMarker(p, {
          radius: 7,
          color: '#7c3aed',
          fillColor: '#a855f7',
          fillOpacity: 1,
          weight: 2,
        }).addTo(mapRef.current!);
        cm.bindTooltip(`${i + 1}`, { permanent: true, direction: 'top', className: 'point-label' });
        drawnMarkersRef.current.push(cm);
      });

      if (drawnPoints.length >= 3) {
        drawnLayerRef.current = L.polygon(drawnPoints, {
          color: '#7c3aed',
          fillColor: '#c084fc',
          fillOpacity: 0.2,
          weight: 3,
        }).addTo(mapRef.current);
      }
    }
  }, [drawnPoints, mapReady]);

  useEffect(() => {
    if (!mapRef.current || !selected) return;
    const marker = markersRef.current.get(selected);
    if (marker) { mapRef.current.setView(marker.getLatLng(), 16, { animate: true }); marker.openPopup(); }
  }, [selected]);

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="w-full h-full" />
      <style jsx global>{`
        .geofence-label {
          background: rgba(147, 51, 234, 0.9) !important;
          color: white !important;
          border: none !important;
          border-radius: 6px !important;
          padding: 2px 8px !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
        }
        .geofence-label::before { display: none !important; }
        .point-label {
          background: #7c3aed !important;
          color: white !important;
          border: none !important;
          border-radius: 50% !important;
          padding: 1px 5px !important;
          font-size: 10px !important;
          font-weight: 700 !important;
          min-width: 18px !important;
          text-align: center !important;
        }
        .point-label::before { display: none !important; }
        .leaflet-control-zoom a {
          width: 32px !important;
          height: 32px !important;
          line-height: 32px !important;
          font-size: 16px !important;
          border-radius: 8px !important;
        }
        .leaflet-control-zoom {
          border: none !important;
          border-radius: 10px !important;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
        }
        .custom-marker { background: none !important; border: none !important; }
      `}</style>
    </div>
  );
}
