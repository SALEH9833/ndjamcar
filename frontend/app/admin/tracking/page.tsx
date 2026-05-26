'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Wifi, WifiOff, Car, Clock, Gauge, Plus, Power, Crosshair, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { VehicleTracking, Vehicle } from '@/lib/types';

const TrackingMap = dynamic(() => import('@/components/TrackingMap'), { ssr: false });

export default function AdminTrackingPage() {
  const [trackings, setTrackings] = useState<VehicleTracking[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const [placingVehicleId, setPlacingVehicleId] = useState<number | null>(null);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [addVehicleId, setAddVehicleId] = useState('');

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

  const trackedVehicleIds = trackings.map(t => t.vehicleId);
  const untrackedVehicles = vehicles.filter(v => !trackedVehicleIds.includes(v.id));

  const addVehicleToTracking = async () => {
    if (!addVehicleId) { toast.error('Choisissez un véhicule'); return; }
    try {
      await api.put(`/api/tracking/${addVehicleId}`, {
        latitude: 12.1348,
        longitude: 15.0557,
        speed: 0,
        heading: 0,
        isOnline: false,
        deviceId: null,
      });
      toast.success('Véhicule ajouté au suivi');
      setShowAddPanel(false);
      setAddVehicleId('');
      fetchTrackings();
    } catch { toast.error('Erreur'); }
  };

  const toggleOnline = async (t: VehicleTracking) => {
    try {
      await api.put(`/api/tracking/${t.vehicleId}`, {
        latitude: t.latitude,
        longitude: t.longitude,
        speed: t.speed,
        heading: t.heading,
        isOnline: !t.isOnline,
      });
      fetchTrackings();
    } catch { toast.error('Erreur'); }
  };

  const removeTracking = async (vehicleId: number) => {
    if (!confirm('Retirer ce véhicule du suivi ?')) return;
    try {
      await api.delete(`/api/tracking/${vehicleId}`);
      toast.success('Retiré du suivi');
      fetchTrackings();
    } catch { toast.error('Erreur'); }
  };

  const handleMapClick = async (lat: number, lng: number) => {
    if (!placingVehicleId) return;
    try {
      await api.put(`/api/tracking/${placingVehicleId}`, {
        latitude: lat,
        longitude: lng,
        speed: 0,
        heading: 0,
        isOnline: true,
      });
      toast.success('Position mise à jour');
      setPlacingVehicleId(null);
      fetchTrackings();
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
        <Button onClick={() => setShowAddPanel(!showAddPanel)} className="gap-2 bg-blue-600 hover:bg-blue-700 rounded-xl">
          <Plus className="h-4 w-4" /> Ajouter un véhicule
        </Button>
      </div>

      {placingVehicleId && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-center gap-3">
          <Crosshair className="h-5 w-5 text-amber-600 animate-pulse" />
          <p className="text-sm text-amber-800 flex-1">
            <strong>Mode placement :</strong> Cliquez sur la carte pour placer le véhicule
          </p>
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
                <div className="flex-1">
                  <select
                    value={addVehicleId}
                    onChange={(e) => setAddVehicleId(e.target.value)}
                    className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm"
                  >
                    <option value="">Choisir un véhicule</option>
                    {untrackedVehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.model.brand.name} {v.model.name} — {v.plateNumber} ({v.status === 'RENTED' ? 'Loué' : v.status === 'AVAILABLE' ? 'Disponible' : v.status})
                      </option>
                    ))}
                  </select>
                </div>
                <Button onClick={addVehicleToTracking} className="bg-blue-600 hover:bg-blue-700 rounded-xl">
                  Ajouter
                </Button>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Tous les véhicules sont déjà suivis</p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="h-[550px] relative">
              {trackings.length > 0 ? (
                <TrackingMap
                  trackings={withPosition}
                  selected={selected}
                  onSelect={setSelected}
                  onMapClick={placingVehicleId ? handleMapClick : undefined}
                  isPlacing={!!placingVehicleId}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
                  <MapPin className="h-16 w-16 text-gray-300 mb-4" />
                  <p className="text-gray-500 font-medium">Aucun véhicule suivi</p>
                  <p className="text-sm text-gray-400 mt-1 mb-4">Ajoutez un véhicule pour commencer le suivi</p>
                  <Button onClick={() => setShowAddPanel(true)} className="gap-2 bg-blue-600 hover:bg-blue-700 rounded-xl">
                    <Plus className="h-4 w-4" /> Ajouter un véhicule
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-3">
          <h2 className="font-semibold text-sm text-gray-500">Véhicules suivis ({trackings.length})</h2>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 bg-white rounded-xl animate-pulse" />)
          ) : trackings.length > 0 ? (
            trackings.map((t) => {
              const vehicleName = t.vehicle ? `${t.vehicle.model.brand.name} ${t.vehicle.model.name}` : `Véhicule #${t.vehicleId}`;
              const isPlacing = placingVehicleId === t.vehicleId;
              return (
                <Card
                  key={t.id}
                  className={`border-0 shadow-sm transition-all ${
                    isPlacing ? 'ring-2 ring-amber-500 bg-amber-50' :
                    selected === t.id ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="cursor-pointer flex-1" onClick={() => setSelected(t.id === selected ? null : t.id)}>
                        <p className="font-semibold text-sm">{vehicleName}</p>
                        <p className="text-xs text-gray-400">{t.vehicle?.plateNumber || ''}</p>
                      </div>
                      <Badge className={`border-0 text-[10px] ${t.isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {t.isOnline ? <><Wifi className="h-3 w-3 mr-1" />En ligne</> : <><WifiOff className="h-3 w-3 mr-1" />Hors ligne</>}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {t.latitude && t.longitude ? (
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{t.latitude.toFixed(4)}, {t.longitude.toFixed(4)}</span>
                      ) : (
                        <span className="text-gray-400">Pas de position</span>
                      )}
                      {t.speed !== null && t.speed > 0 && (
                        <span className="flex items-center gap-1"><Gauge className="h-3 w-3" />{t.speed} km/h</span>
                      )}
                    </div>

                    {t.lastUpdate && (
                      <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {new Date(t.lastUpdate).toLocaleString('fr-FR')}
                      </p>
                    )}

                    <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-gray-100">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPlacingVehicleId(isPlacing ? null : t.vehicleId)}
                        className={`rounded-lg text-xs gap-1 flex-1 ${isPlacing ? 'bg-amber-100 border-amber-300 text-amber-700' : ''}`}
                      >
                        <Crosshair className="h-3 w-3" /> {isPlacing ? 'Placement...' : 'Placer'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleOnline(t)}
                        className={`rounded-lg text-xs gap-1 ${t.isOnline ? 'text-green-600' : 'text-gray-400'}`}
                      >
                        <Power className="h-3 w-3" /> {t.isOnline ? 'En ligne' : 'Hors ligne'}
                      </Button>
                      <button onClick={() => removeTracking(t.vehicleId)} className="p-1.5 rounded-lg hover:bg-red-50">
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      </button>
                    </div>
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
