'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Wifi, WifiOff, Car, Clock, Gauge, Plus, Power, Crosshair, Trash2, X, Shield, ShieldAlert, Pencil, AlertTriangle, Bell } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { VehicleTracking, Vehicle } from '@/lib/types';

const TrackingMap = dynamic(() => import('@/components/TrackingMap'), { ssr: false });

interface Geofence {
  id: number;
  name: string;
  points: string;
  isActive: boolean;
}

interface GeofenceAlert {
  id: number;
  vehicleId: number;
  geofenceId: number;
  type: string;
  latitude: number;
  longitude: number;
  isRead: boolean;
  createdAt: string;
}

type TabType = 'vehicles' | 'zones' | 'alerts';

export default function AdminTrackingPage() {
  const [trackings, setTrackings] = useState<VehicleTracking[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [alerts, setAlerts] = useState<GeofenceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const [placingVehicleId, setPlacingVehicleId] = useState<number | null>(null);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [addVehicleId, setAddVehicleId] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('vehicles');
  const [drawingZone, setDrawingZone] = useState(false);
  const [drawnPoints, setDrawnPoints] = useState<[number, number][]>([]);
  const [zoneName, setZoneName] = useState('');
  const [showZoneForm, setShowZoneForm] = useState(false);

  const fetchTrackings = useCallback(() => {
    api.get('/api/tracking').then(r => setTrackings(r.data.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const fetchVehicles = useCallback(() => {
    api.get('/api/vehicles/all').then(r => setVehicles(r.data.data || [])).catch(() => {});
  }, []);

  const fetchGeofences = useCallback(() => {
    api.get('/api/geofences').then(r => setGeofences(r.data.data || [])).catch(() => {});
  }, []);

  const fetchAlerts = useCallback(() => {
    api.get('/api/geofences/alerts').then(r => setAlerts(r.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    fetchTrackings();
    fetchVehicles();
    fetchGeofences();
    fetchAlerts();
    const interval = setInterval(() => { fetchTrackings(); fetchAlerts(); }, 30000);
    return () => clearInterval(interval);
  }, [fetchTrackings, fetchVehicles, fetchGeofences, fetchAlerts]);

  const trackedVehicleIds = trackings.map(t => t.vehicleId);
  const untrackedVehicles = vehicles.filter(v => !trackedVehicleIds.includes(v.id));

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
    try { await api.delete(`/api/tracking/${vehicleId}`); toast.success('Retiré'); fetchTrackings(); }
    catch { toast.error('Erreur'); }
  };

  const handleMapClick = async (lat: number, lng: number) => {
    if (drawingZone) {
      setDrawnPoints(prev => [...prev, [lat, lng]]);
      return;
    }
    if (!placingVehicleId) return;
    try {
      await api.put(`/api/tracking/${placingVehicleId}`, { latitude: lat, longitude: lng, speed: 0, heading: 0, isOnline: true });
      toast.success('Position mise à jour');
      setPlacingVehicleId(null); fetchTrackings();
    } catch { toast.error('Erreur'); }
  };

  const saveZone = async () => {
    if (!zoneName) { toast.error('Donnez un nom à la zone'); return; }
    if (drawnPoints.length < 3) { toast.error('Dessinez au moins 3 points'); return; }
    try {
      await api.post('/api/geofences', { name: zoneName, points: JSON.stringify(drawnPoints) });
      toast.success('Zone créée');
      setDrawingZone(false); setDrawnPoints([]); setZoneName(''); setShowZoneForm(false);
      fetchGeofences();
    } catch { toast.error('Erreur'); }
  };

  const toggleGeofence = async (gf: Geofence) => {
    try {
      await api.put(`/api/geofences/${gf.id}`, { isActive: !gf.isActive });
      fetchGeofences();
    } catch { toast.error('Erreur'); }
  };

  const deleteGeofence = async (id: number) => {
    if (!confirm('Supprimer cette zone ?')) return;
    try { await api.delete(`/api/geofences/${id}`); toast.success('Zone supprimée'); fetchGeofences(); }
    catch { toast.error('Erreur'); }
  };

  const markAlertRead = async (id: number) => {
    try { await api.put(`/api/geofences/alerts/${id}/read`); fetchAlerts(); }
    catch { toast.error('Erreur'); }
  };

  const online = trackings.filter(t => t.isOnline);
  const withPosition = trackings.filter(t => t.latitude && t.longitude);
  const unreadAlerts = alerts.filter(a => !a.isRead).length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Suivi GPS</h1>
          <p className="text-gray-500 text-sm">
            {online.length} en ligne · {withPosition.length} avec position · {trackings.length} total
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddPanel(!showAddPanel)} className="gap-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs">
            <Plus className="h-4 w-4" /> Véhicule
          </Button>
          <Button onClick={() => { setDrawingZone(true); setDrawnPoints([]); setShowZoneForm(true); setActiveTab('zones'); }} className="gap-2 bg-purple-600 hover:bg-purple-700 rounded-xl text-xs">
            <Shield className="h-4 w-4" /> Nouvelle zone
          </Button>
        </div>
      </div>

      {(placingVehicleId || drawingZone) && (
        <div className={`${drawingZone ? 'bg-purple-50 border-purple-200' : 'bg-amber-50 border-amber-200'} border rounded-xl p-3 mb-4 flex items-center gap-3`}>
          {drawingZone ? <Shield className="h-5 w-5 text-purple-600 animate-pulse" /> : <Crosshair className="h-5 w-5 text-amber-600 animate-pulse" />}
          <p className="text-sm flex-1">
            {drawingZone
              ? <><strong>Mode zone :</strong> Cliquez sur la carte pour dessiner la zone ({drawnPoints.length} point(s))</>
              : <><strong>Mode placement :</strong> Cliquez sur la carte pour placer le véhicule</>
            }
          </p>
          {drawingZone && drawnPoints.length >= 3 && (
            <Button size="sm" onClick={saveZone} className="bg-purple-600 hover:bg-purple-700 rounded-lg text-xs">Valider</Button>
          )}
          <Button size="sm" variant="outline" onClick={() => { setPlacingVehicleId(null); setDrawingZone(false); setDrawnPoints([]); setShowZoneForm(false); }} className="rounded-lg text-xs">
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

      {showZoneForm && (
        <Card className="border-0 shadow-lg mb-6">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-purple-600" />
              <Input value={zoneName} onChange={(e) => setZoneName(e.target.value)} placeholder="Nom de la zone (ex: Zone N'Djamena)" className="h-10 rounded-lg flex-1" />
              {drawnPoints.length >= 3 && (
                <Button onClick={saveZone} className="bg-purple-600 hover:bg-purple-700 rounded-xl gap-1">
                  <Shield className="h-4 w-4" /> Sauvegarder ({drawnPoints.length} pts)
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="h-[550px] relative">
              <TrackingMap
                trackings={withPosition}
                selected={selected}
                onSelect={setSelected}
                onMapClick={handleMapClick}
                isPlacing={!!placingVehicleId || drawingZone}
                geofences={geofences.filter(g => g.isActive)}
                drawnPoints={drawnPoints}
              />
            </div>
          </Card>
        </div>

        <div className="space-y-3">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {([
              { key: 'vehicles' as TabType, label: 'Véhicules', count: trackings.length },
              { key: 'zones' as TabType, label: 'Zones', count: geofences.length },
              { key: 'alerts' as TabType, label: 'Alertes', count: unreadAlerts },
            ]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === tab.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label} {tab.count > 0 && <Badge className={`ml-1 text-[9px] px-1 border-0 ${tab.key === 'alerts' && unreadAlerts > 0 ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'}`}>{tab.count}</Badge>}
              </button>
            ))}
          </div>

          {activeTab === 'vehicles' && (
            <>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 bg-white rounded-xl animate-pulse" />)
              ) : trackings.length > 0 ? (
                trackings.map((t) => {
                  const vehicleName = t.vehicle ? `${t.vehicle.model.brand.name} ${t.vehicle.model.name}` : `Véhicule #${t.vehicleId}`;
                  const isPlacing = placingVehicleId === t.vehicleId;
                  return (
                    <Card key={t.id} className={`border-0 shadow-sm transition-all ${isPlacing ? 'ring-2 ring-amber-500 bg-amber-50' : selected === t.id ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}>
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
                            <Clock className="h-2.5 w-2.5" />{new Date(t.lastUpdate).toLocaleString('fr-FR')}
                          </p>
                        )}
                        <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-gray-100">
                          <Button size="sm" variant="outline" onClick={() => setPlacingVehicleId(isPlacing ? null : t.vehicleId)}
                            className={`rounded-lg text-xs gap-1 flex-1 ${isPlacing ? 'bg-amber-100 border-amber-300 text-amber-700' : ''}`}>
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
            </>
          )}

          {activeTab === 'zones' && (
            <>
              {geofences.length > 0 ? (
                geofences.map((gf) => {
                  const pts = JSON.parse(gf.points) as [number, number][];
                  return (
                    <Card key={gf.id} className="border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-semibold text-sm flex items-center gap-1.5">
                              <Shield className={`h-3.5 w-3.5 ${gf.isActive ? 'text-purple-600' : 'text-gray-400'}`} />
                              {gf.name}
                            </p>
                            <p className="text-[10px] text-gray-400">{pts.length} points</p>
                          </div>
                          <Badge className={`border-0 text-[10px] ${gf.isActive ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                            {gf.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1.5 mt-2">
                          <Button size="sm" variant="outline" onClick={() => toggleGeofence(gf)}
                            className={`rounded-lg text-xs gap-1 flex-1 ${gf.isActive ? 'text-purple-600' : 'text-gray-400'}`}>
                            <Power className="h-3 w-3" /> {gf.isActive ? 'Désactiver' : 'Activer'}
                          </Button>
                          <button onClick={() => deleteGeofence(gf.id)} className="p-1.5 rounded-lg hover:bg-red-50">
                            <Trash2 className="h-3.5 w-3.5 text-red-400" />
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <Shield className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Aucune zone définie</p>
                  <p className="text-xs text-gray-400 mt-1">Créez une zone pour délimiter la circulation</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'alerts' && (
            <>
              {alerts.length > 0 ? (
                alerts.map((alert) => {
                  const vehicle = trackings.find(t => t.vehicleId === alert.vehicleId);
                  const vehicleName = vehicle?.vehicle ? `${vehicle.vehicle.model.brand.name} ${vehicle.vehicle.model.name}` : `Véhicule #${alert.vehicleId}`;
                  return (
                    <Card key={alert.id} className={`border-0 shadow-sm ${!alert.isRead ? 'border-l-4 border-l-red-500' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-sm flex items-center gap-1.5">
                              <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                              {vehicleName}
                            </p>
                            <p className="text-xs text-red-600 mt-0.5">Sortie de zone autorisée</p>
                            <p className="text-[10px] text-gray-400 mt-1">{new Date(alert.createdAt).toLocaleString('fr-FR')}</p>
                            <p className="text-[10px] text-gray-400">{alert.latitude.toFixed(5)}, {alert.longitude.toFixed(5)}</p>
                          </div>
                          {!alert.isRead && (
                            <button onClick={() => markAlertRead(alert.id)} className="p-1.5 rounded-lg hover:bg-gray-100" title="Marquer comme lu">
                              <Bell className="h-3.5 w-3.5 text-red-500" />
                            </button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <ShieldAlert className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Aucune alerte</p>
                  <p className="text-xs text-gray-400 mt-1">Les alertes de sortie de zone apparaîtront ici</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
