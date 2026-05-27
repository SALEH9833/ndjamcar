'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Wifi, WifiOff, Car, Clock, Gauge, Plus, Power, Crosshair, Trash2, X, Navigation, Search, Route, Loader2, ToggleLeft, ToggleRight, Radio, Eye, Link2, Copy, RefreshCw, Cpu, Check } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { VehicleTracking, Vehicle } from '@/lib/types';

const TrackingMap = dynamic(() => import('@/components/TrackingMap'), { ssr: false });

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

export default function AdminTrackingPage() {
  const [trackings, setTrackings] = useState<VehicleTracking[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const [placingVehicleId, setPlacingVehicleId] = useState<number | null>(null);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [addVehicleId, setAddVehicleId] = useState('');
  const [followingId, setFollowingId] = useState<number | null>(null);
  const [editingImei, setEditingImei] = useState<number | null>(null);
  const [imeiValue, setImeiValue] = useState('');

  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');
  const [fromResults, setFromResults] = useState<SearchResult[]>([]);
  const [toResults, setToResults] = useState<SearchResult[]>([]);
  const [searchingFrom, setSearchingFrom] = useState(false);
  const [searchingTo, setSearchingTo] = useState(false);
  const [routeFrom, setRouteFrom] = useState<[number, number] | null>(null);
  const [routeTo, setRouteTo] = useState<[number, number] | null>(null);
  const [fromSelected, setFromSelected] = useState('');
  const [toSelected, setToSelected] = useState('');
  const [trafficEnabled, setTrafficEnabled] = useState(false);
  const [restored, setRestored] = useState(false);

  const fromTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const followIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('ndjamcar_route');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.fromQuery) setFromQuery(data.fromQuery);
        if (data.toQuery) setToQuery(data.toQuery);
        if (data.fromSelected) setFromSelected(data.fromSelected);
        if (data.toSelected) setToSelected(data.toSelected);
        if (data.routeFrom) setRouteFrom(data.routeFrom);
        if (data.routeTo) setRouteTo(data.routeTo);
        if (data.trafficEnabled) setTrafficEnabled(data.trafficEnabled);
      }
    } catch {}
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored) return;
    try {
      if (routeFrom || routeTo) {
        localStorage.setItem('ndjamcar_route', JSON.stringify({
          fromQuery, toQuery, fromSelected, toSelected, routeFrom, routeTo, trafficEnabled,
        }));
      } else {
        localStorage.removeItem('ndjamcar_route');
      }
    } catch {}
  }, [fromQuery, toQuery, fromSelected, toSelected, routeFrom, routeTo, trafficEnabled, restored]);

  const fetchTrackings = useCallback(() => {
    api.get('/api/tracking').then(r => setTrackings(r.data.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const fetchVehicles = useCallback(() => {
    api.get('/api/vehicles/all').then(r => setVehicles(r.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    fetchTrackings();
    fetchVehicles();
    const interval = setInterval(fetchTrackings, 30000);
    return () => clearInterval(interval);
  }, [fetchTrackings, fetchVehicles]);

  useEffect(() => {
    if (followIntervalRef.current) {
      clearInterval(followIntervalRef.current);
      followIntervalRef.current = null;
    }
    if (followingId) {
      followIntervalRef.current = setInterval(fetchTrackings, 5000);
    }
    return () => {
      if (followIntervalRef.current) clearInterval(followIntervalRef.current);
    };
  }, [followingId, fetchTrackings]);

  const trackedVehicleIds = trackings.map(t => t.vehicleId);
  const untrackedVehicles = vehicles.filter(v => !trackedVehicleIds.includes(v.id));

  const followedTracking = followingId ? trackings.find(t => t.id === followingId) : null;
  const followedName = followedTracking?.vehicle
    ? `${followedTracking.vehicle.model.brand.name} ${followedTracking.vehicle.model.name}`
    : followedTracking ? `Véhicule #${followedTracking.vehicleId}` : '';

  const getTrackingUrl = (t: VehicleTracking) => {
    if (!t.trackingToken) return null;
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    return `${base}/track/${t.trackingToken}`;
  };

  const copyGpsLink = async (t: VehicleTracking) => {
    let token = t.trackingToken;
    if (!token) {
      try {
        const res = await api.post(`/api/tracking/${t.vehicleId}/generate-token`);
        token = res.data.data.trackingToken;
        fetchTrackings();
      } catch { toast.error('Erreur'); return; }
    }
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${base}/track/${token}`;
    await navigator.clipboard.writeText(url);
    toast.success('Lien GPS copié !');
  };

  const regenerateToken = async (t: VehicleTracking) => {
    try {
      const res = await api.post(`/api/tracking/${t.vehicleId}/generate-token`);
      const token = res.data.data.trackingToken;
      const base = typeof window !== 'undefined' ? window.location.origin : '';
      await navigator.clipboard.writeText(`${base}/track/${token}`);
      toast.success('Nouveau lien généré et copié !');
      fetchTrackings();
    } catch { toast.error('Erreur'); }
  };

  const saveImei = async (vehicleId: number) => {
    if (!imeiValue.trim()) { toast.error('Entrez un IMEI'); return; }
    try {
      await api.put(`/api/tracking/${vehicleId}/imei`, { imei: imeiValue.trim() });
      toast.success('Traceur GPS associé');
      setEditingImei(null);
      setImeiValue('');
      fetchTrackings();
    } catch { toast.error('Erreur'); }
  };

  const removeImei = async (vehicleId: number) => {
    try {
      await api.delete(`/api/tracking/${vehicleId}/imei`);
      toast.success('Traceur dissocié');
      fetchTrackings();
    } catch { toast.error('Erreur'); }
  };

  const startFollowing = (t: VehicleTracking) => {
    setFollowingId(t.id);
    setSelected(t.id);
    setPlacingVehicleId(null);
    toast.success(`Suivi en temps réel activé`);
  };

  const stopFollowing = () => {
    setFollowingId(null);
    toast.info('Suivi arrêté');
  };

  const geocode = async (query: string): Promise<SearchResult[]> => {
    if (query.length < 3) return [];
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=td,cm,ng,cf`);
      return await res.json();
    } catch { return []; }
  };

  const handleFromChange = (val: string) => {
    setFromQuery(val);
    setFromSelected('');
    if (fromTimeoutRef.current) clearTimeout(fromTimeoutRef.current);
    if (val.length < 3) { setFromResults([]); return; }
    setSearchingFrom(true);
    fromTimeoutRef.current = setTimeout(async () => {
      const results = await geocode(val);
      setFromResults(results);
      setSearchingFrom(false);
    }, 500);
  };

  const handleToChange = (val: string) => {
    setToQuery(val);
    setToSelected('');
    if (toTimeoutRef.current) clearTimeout(toTimeoutRef.current);
    if (val.length < 3) { setToResults([]); return; }
    setSearchingTo(true);
    toTimeoutRef.current = setTimeout(async () => {
      const results = await geocode(val);
      setToResults(results);
      setSearchingTo(false);
    }, 500);
  };

  const selectFrom = (r: SearchResult) => {
    setRouteFrom([parseFloat(r.lat), parseFloat(r.lon)]);
    setFromQuery(r.display_name);
    setFromSelected(r.display_name);
    setFromResults([]);
  };

  const selectTo = (r: SearchResult) => {
    setRouteTo([parseFloat(r.lat), parseFloat(r.lon)]);
    setToQuery(r.display_name);
    setToSelected(r.display_name);
    setToResults([]);
  };

  const clearRoute = () => {
    setRouteFrom(null);
    setRouteTo(null);
    setFromQuery('');
    setToQuery('');
    setFromSelected('');
    setToSelected('');
    setFromResults([]);
    setToResults([]);
  };

  const addVehicleToTracking = async () => {
    if (!addVehicleId) { toast.error('Choisissez un véhicule'); return; }
    try {
      await api.put(`/api/tracking/${addVehicleId}`, { latitude: 12.1348, longitude: 15.0557, speed: 0, heading: 0, isOnline: false, deviceId: null });
      toast.success('Véhicule ajouté au suivi');
      setShowAddPanel(false); setAddVehicleId(''); fetchTrackings();
    } catch { toast.error('Erreur'); }
  };

  const toggleOnline = async (t: VehicleTracking) => {
    try {
      await api.put(`/api/tracking/${t.vehicleId}`, { latitude: t.latitude, longitude: t.longitude, speed: t.speed, heading: t.heading, isOnline: !t.isOnline });
      fetchTrackings();
    } catch { toast.error('Erreur'); }
  };

  const removeTracking = async (vehicleId: number) => {
    if (!confirm('Retirer ce véhicule du suivi ?')) return;
    try {
      await api.delete(`/api/tracking/${vehicleId}`);
      toast.success('Retiré');
      if (followedTracking && followedTracking.vehicleId === vehicleId) setFollowingId(null);
      fetchTrackings();
    } catch { toast.error('Erreur'); }
  };

  const handleMapClick = async (lat: number, lng: number) => {
    if (!placingVehicleId) return;
    try {
      await api.put(`/api/tracking/${placingVehicleId}`, { latitude: lat, longitude: lng, speed: 0, heading: 0, isOnline: true });
      toast.success('Position mise à jour');
      setPlacingVehicleId(null); fetchTrackings();
    } catch { toast.error('Erreur'); }
  };

  const online = trackings.filter(t => t.isOnline);
  const withPosition = trackings.filter(t => t.latitude && t.longitude);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Suivi GPS</h1>
          <p className="text-gray-500 text-sm">
            {online.length} en ligne · {withPosition.length} avec position · {trackings.length} total
          </p>
        </div>
        <Button onClick={() => setShowAddPanel(!showAddPanel)} className="gap-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs">
          <Plus className="h-4 w-4" /> Véhicule
        </Button>
      </div>

      {followingId && followedTracking && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 flex items-center gap-3">
          <Radio className="h-5 w-5 text-green-600 animate-pulse" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-green-800">Suivi en temps réel : {followedName}</p>
            <p className="text-xs text-green-600">
              {followedTracking.latitude?.toFixed(4)}, {followedTracking.longitude?.toFixed(4)}
              {followedTracking.speed && followedTracking.speed > 0 ? ` · ${followedTracking.speed} km/h` : ''}
              {' · '}Rafraîchissement toutes les 5s
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={stopFollowing} className="rounded-lg text-xs border-green-300 text-green-700 hover:bg-green-100">
            <X className="h-3 w-3 mr-1" /> Arrêter
          </Button>
        </div>
      )}

      {placingVehicleId && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-center gap-3">
          <Crosshair className="h-5 w-5 text-amber-600 animate-pulse" />
          <p className="text-sm flex-1"><strong>Mode placement :</strong> Cliquez sur la carte pour placer le véhicule</p>
          <Button size="sm" variant="outline" onClick={() => setPlacingVehicleId(null)} className="rounded-lg text-xs">
            <X className="h-3 w-3 mr-1" /> Annuler
          </Button>
        </div>
      )}

      {showAddPanel && (
        <Card className="border-0 shadow-lg mb-6">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Ajouter un véhicule au suivi</h3>
              <button onClick={() => setShowAddPanel(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            {untrackedVehicles.length > 0 ? (
              <div className="flex gap-3 items-end">
                <select value={addVehicleId} onChange={(e) => setAddVehicleId(e.target.value)} className="flex-1 h-10 rounded-lg border border-gray-200 px-3 text-sm">
                  <option value="">Choisir un véhicule</option>
                  {untrackedVehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.model.brand.name} {v.model.name} — {v.plateNumber}</option>
                  ))}
                </select>
                <Button onClick={addVehicleToTracking} className="bg-blue-600 hover:bg-blue-700 rounded-xl">Ajouter</Button>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Tous les véhicules sont déjà suivis</p>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="border-0 shadow-lg mb-6">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Route className="h-5 w-5 text-blue-600" />
            <h3 className="font-bold">Recherche d&apos;itinéraire</h3>
            <div className="flex-1" />
            <button
              onClick={() => setTrafficEnabled(!trafficEnabled)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${trafficEnabled ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}
            >
              {trafficEnabled ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
              Trafic
            </button>
            {(routeFrom || routeTo) && (
              <Button size="sm" variant="outline" onClick={clearRoute} className="rounded-lg text-xs gap-1">
                <X className="h-3 w-3" /> Effacer
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 shrink-0" />
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={fromQuery}
                    onChange={(e) => handleFromChange(e.target.value)}
                    placeholder="Point de départ..."
                    className="h-10 rounded-lg pl-9"
                  />
                  {searchingFrom && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500 animate-spin" />}
                </div>
              </div>
              {fromResults.length > 0 && !fromSelected && (
                <div className="absolute z-50 top-full left-5 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {fromResults.map((r, i) => (
                    <button key={i} onClick={() => selectFrom(r)} className="w-full text-left px-3 py-2.5 text-sm hover:bg-blue-50 border-b border-gray-50 last:border-0 flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{r.display_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={toQuery}
                    onChange={(e) => handleToChange(e.target.value)}
                    placeholder="Point d&apos;arrivée..."
                    className="h-10 rounded-lg pl-9"
                  />
                  {searchingTo && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500 animate-spin" />}
                </div>
              </div>
              {toResults.length > 0 && !toSelected && (
                <div className="absolute z-50 top-full left-5 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {toResults.map((r, i) => (
                    <button key={i} onClick={() => selectTo(r)} className="w-full text-left px-3 py-2.5 text-sm hover:bg-blue-50 border-b border-gray-50 last:border-0 flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{r.display_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {routeFrom && routeTo && (
            <div className="mt-3 flex items-center gap-2 text-xs text-blue-600">
              <Navigation className="h-3.5 w-3.5" />
              <span>Itinéraire affiché sur la carte</span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="h-[550px] relative">
              <TrackingMap
                trackings={withPosition}
                selected={selected}
                onSelect={setSelected}
                onMapClick={handleMapClick}
                isPlacing={!!placingVehicleId}
                routeFrom={routeFrom}
                routeTo={routeTo}
                trafficEnabled={trafficEnabled}
                followingId={followingId}
              />
            </div>
          </Card>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1 mb-1">
            <Car className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-700">Véhicules suivis</span>
            <Badge className="bg-gray-100 text-gray-600 border-0 text-[10px]">{trackings.length}</Badge>
          </div>

          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 bg-white rounded-xl animate-pulse" />)
          ) : trackings.length > 0 ? (
            trackings.map((t) => {
              const vehicleName = t.vehicle ? `${t.vehicle.model.brand.name} ${t.vehicle.model.name}` : `Véhicule #${t.vehicleId}`;
              const isPlacing = placingVehicleId === t.vehicleId;
              const isFollowing = followingId === t.id;
              const hasPosition = !!(t.latitude && t.longitude);
              return (
                <Card key={t.id} className={`border-0 shadow-sm transition-all ${isFollowing ? 'ring-2 ring-green-500 bg-green-50' : isPlacing ? 'ring-2 ring-amber-500 bg-amber-50' : selected === t.id ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="cursor-pointer flex-1" onClick={() => setSelected(t.id === selected ? null : t.id)}>
                        <p className="font-semibold text-sm flex items-center gap-1.5">
                          {isFollowing && <Radio className="h-3 w-3 text-green-600 animate-pulse" />}
                          {vehicleName}
                        </p>
                        <p className="text-xs text-gray-400">{t.vehicle?.plateNumber || ''}</p>
                      </div>
                      <Badge className={`border-0 text-[10px] ${t.isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {t.isOnline ? <><Wifi className="h-3 w-3 mr-1" />En ligne</> : <><WifiOff className="h-3 w-3 mr-1" />Hors ligne</>}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {hasPosition ? (
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{t.latitude!.toFixed(4)}, {t.longitude!.toFixed(4)}</span>
                      ) : (
                        <span className="text-gray-400">Pas de position</span>
                      )}
                      {t.speed !== null && t.speed > 0 && (
                        <span className="flex items-center gap-1"><Gauge className="h-3 w-3" />{t.speed} km/h</span>
                      )}
                    </div>
                    {t.lastUpdate && (
                      <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />{new Date(t.lastUpdate).toLocaleString('fr-FR')}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-gray-100">
                      {hasPosition && (
                        <Button size="sm" onClick={() => isFollowing ? stopFollowing() : startFollowing(t)}
                          className={`rounded-lg text-xs gap-1 flex-1 ${isFollowing ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                          {isFollowing ? <><Eye className="h-3 w-3" /> Suivi actif</> : <><Radio className="h-3 w-3" /> Suivre</>}
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => { setPlacingVehicleId(isPlacing ? null : t.vehicleId); if (!isPlacing) setFollowingId(null); }}
                        className={`rounded-lg text-xs gap-1 ${isPlacing ? 'bg-amber-100 border-amber-300 text-amber-700' : ''}`}>
                        <Crosshair className="h-3 w-3" /> {isPlacing ? 'Placement...' : 'Placer'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => toggleOnline(t)}
                        className={`rounded-lg text-xs gap-1 ${t.isOnline ? 'text-green-600' : 'text-gray-400'}`}>
                        <Power className="h-3 w-3" />
                      </Button>
                      <button onClick={() => removeTracking(t.vehicleId)} className="p-1.5 rounded-lg hover:bg-red-50">
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      </button>
                    </div>
                    {editingImei === t.vehicleId ? (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <p className="text-[10px] text-gray-400 mb-1.5">IMEI du traceur GPS (15 chiffres sur le boîtier)</p>
                        <div className="flex items-center gap-1.5">
                          <Input
                            value={imeiValue}
                            onChange={(e) => setImeiValue(e.target.value)}
                            placeholder="Ex: 860123456789012"
                            className="h-8 rounded-lg text-xs font-mono flex-1"
                            maxLength={15}
                          />
                          <Button size="sm" onClick={() => saveImei(t.vehicleId)} className="bg-green-600 hover:bg-green-700 rounded-lg h-8 px-2">
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { setEditingImei(null); setImeiValue(''); }} className="rounded-lg h-8 px-2">
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ) : t.imei ? (
                      <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-2">
                        <Cpu className="h-3 w-3 text-blue-500" />
                        <span className="text-[10px] font-mono text-gray-600 flex-1">{t.imei}</span>
                        <Badge className="bg-blue-50 text-blue-600 border-0 text-[9px]">Traceur GPS</Badge>
                        <button onClick={() => { setEditingImei(t.vehicleId); setImeiValue(t.imei || ''); }} className="p-1 rounded hover:bg-gray-100" title="Modifier IMEI">
                          <RefreshCw className="h-3 w-3 text-gray-400" />
                        </button>
                        <button onClick={() => removeImei(t.vehicleId)} className="p-1 rounded hover:bg-red-50" title="Dissocier">
                          <Trash2 className="h-3 w-3 text-red-400" />
                        </button>
                      </div>
                    ) : (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <button
                          onClick={() => { setEditingImei(t.vehicleId); setImeiValue(''); }}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Cpu className="h-3 w-3" /> Associer un traceur GPS (IMEI)
                        </button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="text-center py-8">
              <Car className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Aucun véhicule suivi</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
