'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import type { VehicleTracking } from '@/lib/types';

interface Props {
  trackings: VehicleTracking[];
  selected: number | null;
  onSelect: (id: number | null) => void;
  onMapClick?: (lat: number, lng: number) => void;
  isPlacing?: boolean;
  routeFrom?: [number, number] | null;
  routeTo?: [number, number] | null;
  trafficEnabled?: boolean;
  followingId?: number | null;
}

export default function TrackingMap({ trackings, selected, onSelect, onMapClick, isPlacing, routeFrom, routeTo, trafficEnabled, followingId }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const clickHandlerRef = useRef<((e: L.LeafletMouseEvent) => void) | null>(null);
  const routingRef = useRef<L.Routing.Control | null>(null);
  const trafficLayerRef = useRef<L.TileLayer | null>(null);
  const followTrailRef = useRef<L.Polyline | null>(null);
  const followPositionsRef = useRef<[number, number][]>([]);
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
      const isFollowed = followingId === t.id;
      const color = isFollowed ? '#2563eb' : t.isOnline ? '#16a34a' : '#9ca3af';
      const size = isFollowed ? 44 : 36;
      const iconSize = isFollowed ? 22 : 18;
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background:${color};width:${size}px;height:${size}px;border-radius:50%;border:3px solid white;box-shadow:0 2px 12px rgba(0,0,0,${isFollowed ? '0.5' : '0.3'});display:flex;align-items:center;justify-content:center;position:relative;${isFollowed ? 'animation:pulse-ring 2s ease-out infinite' : ''}">
          <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/><path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/><path d="M5 17h-2v-6l2 -5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-4 0h-6m-6 -6h15m-6 0v-5"/></svg>
          ${t.speed && t.speed > 0 ? `<div style="position:absolute;top:-8px;right:-8px;background:#3b82f6;color:white;font-size:9px;font-weight:bold;padding:1px 4px;border-radius:8px;white-space:nowrap">${t.speed}km/h</div>` : ''}
          ${isFollowed ? `<div style="position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);background:#2563eb;color:white;font-size:8px;font-weight:bold;padding:0 4px;border-radius:4px;white-space:nowrap">LIVE</div>` : ''}
        </div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
      const marker = L.marker([t.latitude, t.longitude], { icon, zIndexOffset: isFollowed ? 1000 : 0 })
        .addTo(mapRef.current!)
        .bindPopup(`<div style="min-width:180px"><strong>${vehicleName}</strong>${isFollowed ? ' <span style="color:#2563eb;font-size:10px">● LIVE</span>' : ''}<br/><span style="color:#666;font-size:11px">${t.vehicle?.plateNumber || ''}</span><br/><div style="margin-top:6px;display:flex;align-items:center;gap:4px"><div style="width:8px;height:8px;border-radius:50%;background:${t.isOnline ? '#16a34a' : '#9ca3af'}"></div><span style="font-size:11px">${t.isOnline ? 'En ligne' : 'Hors ligne'}</span></div>${t.speed ? `<div style="font-size:11px;margin-top:4px">Vitesse: ${t.speed} km/h</div>` : ''}${t.lastUpdate ? `<div style="font-size:10px;color:#999;margin-top:4px">${new Date(t.lastUpdate).toLocaleString('fr-FR')}</div>` : ''}</div>`);
      marker.on('click', () => onSelect(t.id));
      markersRef.current.set(t.id, marker);
    });

    if (followingId) {
      const followed = trackings.find(t => t.id === followingId);
      if (followed && followed.latitude && followed.longitude) {
        mapRef.current.setView([followed.latitude, followed.longitude], Math.max(mapRef.current.getZoom(), 15), { animate: true });

        const pos: [number, number] = [followed.latitude, followed.longitude];
        const trail = followPositionsRef.current;
        if (trail.length === 0 || trail[trail.length - 1][0] !== pos[0] || trail[trail.length - 1][1] !== pos[1]) {
          trail.push(pos);
          if (trail.length > 100) trail.shift();
        }

        if (followTrailRef.current) followTrailRef.current.remove();
        if (trail.length >= 2) {
          followTrailRef.current = L.polyline(trail, {
            color: '#2563eb',
            weight: 3,
            opacity: 0.5,
            dashArray: '8, 6',
          }).addTo(mapRef.current);
        }
      }
    } else {
      if (followTrailRef.current) { followTrailRef.current.remove(); followTrailRef.current = null; }
      followPositionsRef.current = [];

      if (trackings.length > 0 && !routeFrom && !routeTo) {
        const valid = trackings.filter(t => t.latitude && t.longitude);
        if (valid.length === 1) {
          mapRef.current.setView([valid[0].latitude!, valid[0].longitude!], 14, { animate: true });
        } else if (valid.length > 1) {
          const bounds = L.latLngBounds(valid.map(t => [t.latitude!, t.longitude!]));
          mapRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
        }
      }
    }
  }, [trackings, onSelect, mapReady, routeFrom, routeTo, followingId]);

  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    if (routingRef.current) {
      mapRef.current.removeControl(routingRef.current);
      routingRef.current = null;
    }

    if (routeFrom && routeTo) {
      routingRef.current = L.Routing.control({
        waypoints: [
          L.latLng(routeFrom[0], routeFrom[1]),
          L.latLng(routeTo[0], routeTo[1]),
        ],
        routeWhileDragging: true,
        showAlternatives: true,
        addWaypoints: false,
        fitSelectedRoutes: !followingId,
        show: false,
        lineOptions: {
          styles: [
            { color: '#3b82f6', opacity: 0.9, weight: 6 },
            { color: '#1d4ed8', opacity: 0.4, weight: 10 },
          ],
          extendToWaypoints: true,
          missingRouteTolerance: 0,
        },
        altLineOptions: {
          styles: [
            { color: '#9ca3af', opacity: 0.6, weight: 4 },
          ],
          extendToWaypoints: true,
          missingRouteTolerance: 0,
        },
        createMarker: (i: number, wp: L.Routing.Waypoint) => {
          const isStart = i === 0;
          const markerIcon = L.divIcon({
            className: 'route-marker',
            html: `<div style="background:${isStart ? '#16a34a' : '#ef4444'};width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center">
              <span style="color:white;font-size:14px;font-weight:bold">${isStart ? 'A' : 'B'}</span>
            </div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });
          return L.marker(wp.latLng, { icon: markerIcon });
        },
      } as L.Routing.RoutingControlOptions).addTo(mapRef.current);
    }
  }, [routeFrom, routeTo, mapReady, followingId]);

  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    if (trafficLayerRef.current) {
      mapRef.current.removeLayer(trafficLayerRef.current);
      trafficLayerRef.current = null;
    }

    if (trafficEnabled) {
      trafficLayerRef.current = L.tileLayer(
        'https://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=6170aad10dfd42a38d4d8c709a536f38',
        { attribution: '&copy; Thunderforest', maxZoom: 19, opacity: 0.7 }
      );
      trafficLayerRef.current.addTo(mapRef.current);
    }
  }, [trafficEnabled, mapReady]);

  useEffect(() => {
    if (!mapRef.current || !selected || followingId) return;
    const marker = markersRef.current.get(selected);
    if (marker) { mapRef.current.setView(marker.getLatLng(), 16, { animate: true }); marker.openPopup(); }
  }, [selected, followingId]);

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="w-full h-full" />
      <style jsx global>{`
        .leaflet-routing-container { display: none !important; }
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.6); }
          70% { box-shadow: 0 0 0 15px rgba(37, 99, 235, 0); }
          100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
        }
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
        .route-marker { background: none !important; border: none !important; }
      `}</style>
    </div>
  );
}
