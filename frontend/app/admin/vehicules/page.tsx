'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Upload, X, Car, Search, Star, StarOff, ImageIcon, ImagePlus } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { Vehicle, Brand } from '@/lib/types';

export default function AdminVehiculesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [showImages, setShowImages] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  const [modelId, setModelId] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [color, setColor] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [seats, setSeats] = useState('5');
  const [transmission, setTransmission] = useState('MANUAL');
  const [fuelType, setFuelType] = useState('ESSENCE');
  const [pricePerDay, setPricePerDay] = useState('');
  const [pricePerWeek, setPricePerWeek] = useState('');
  const [pricePerMonth, setPricePerMonth] = useState('');
  const [description, setDescription] = useState('');
  const [features, setFeatures] = useState('');
  const [mileage, setMileage] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [newImages, setNewImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const fetchVehicles = useCallback(() => {
    setLoading(true);
    api.get('/api/vehicles/all').then(r => setVehicles(r.data.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchVehicles();
    api.get('/api/brands').then(r => setBrands(r.data.data || [])).catch(() => {});
  }, [fetchVehicles]);

  const resetForm = () => {
    setEditId(null); setModelId(''); setYear(new Date().getFullYear().toString());
    setColor(''); setPlateNumber(''); setSeats('5'); setTransmission('MANUAL');
    setFuelType('ESSENCE'); setPricePerDay(''); setPricePerWeek(''); setPricePerMonth('');
    setDescription(''); setFeatures(''); setMileage(''); setIsFeatured(false); setSelectedBrand('');
    setNewImages([]); previewUrls.forEach(u => URL.revokeObjectURL(u)); setPreviewUrls([]);
  };

  const openEdit = (v: Vehicle) => {
    setEditId(v.id); setSelectedBrand(v.model.brand.id.toString()); setModelId(v.modelId.toString());
    setYear(v.year.toString()); setColor(v.color || ''); setPlateNumber(v.plateNumber);
    setSeats(v.seats.toString()); setTransmission(v.transmission); setFuelType(v.fuelType);
    setPricePerDay(v.pricePerDay.toString()); setPricePerWeek(v.pricePerWeek?.toString() || '');
    setPricePerMonth(v.pricePerMonth?.toString() || ''); setDescription(v.description || '');
    setFeatures(v.features || ''); setMileage(v.mileage?.toString() || ''); setIsFeatured(v.isFeatured);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelId || !plateNumber || !pricePerDay) { toast.error('Champs obligatoires manquants'); return; }
    const body = {
      modelId: parseInt(modelId), year: parseInt(year), color: color || null,
      plateNumber, seats: parseInt(seats), transmission, fuelType,
      pricePerDay: parseFloat(pricePerDay),
      pricePerWeek: pricePerWeek ? parseFloat(pricePerWeek) : null,
      pricePerMonth: pricePerMonth ? parseFloat(pricePerMonth) : null,
      description: description || null, features: features || null,
      mileage: mileage ? parseInt(mileage) : null, isFeatured,
    };
    try {
      let vehicleId = editId;
      if (editId) {
        await api.put(`/api/vehicles/${editId}`, body);
        toast.success('Véhicule modifié');
      } else {
        const res = await api.post('/api/vehicles', body);
        vehicleId = res.data.data.id;
        toast.success('Véhicule ajouté');
      }
      if (newImages.length > 0 && vehicleId) {
        const fd = new FormData();
        newImages.forEach(f => fd.append('images', f));
        await api.post(`/api/vehicles/${vehicleId}/images`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success(`${newImages.length} image(s) uploadée(s)`);
      }
      setShowForm(false); resetForm(); fetchVehicles();
    } catch { toast.error('Erreur'); }
  };

  const deleteVehicle = async (id: number) => {
    if (!confirm('Supprimer ce véhicule ?')) return;
    try { await api.delete(`/api/vehicles/${id}`); toast.success('Supprimé'); fetchVehicles(); }
    catch { toast.error('Erreur'); }
  };

  const toggleFeatured = async (v: Vehicle) => {
    try {
      await api.put(`/api/vehicles/${v.id}`, { isFeatured: !v.isFeatured });
      fetchVehicles();
    } catch { toast.error('Erreur'); }
  };

  const updateStatus = async (id: number, status: string) => {
    try { await api.put(`/api/vehicles/${id}`, { status }); toast.success('Statut mis à jour'); fetchVehicles(); }
    catch { toast.error('Erreur'); }
  };

  const handleImageUpload = async (vehicleId: number, files: FileList) => {
    setUploading(true);
    const fd = new FormData();
    Array.from(files).forEach(f => fd.append('images', f));
    try {
      await api.post(`/api/vehicles/${vehicleId}/images`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Images uploadées');
      fetchVehicles();
    } catch { toast.error('Erreur upload'); }
    finally { setUploading(false); }
  };

  const deleteImage = async (vehicleId: number, imageId: number) => {
    try { await api.delete(`/api/vehicles/${vehicleId}/images/${imageId}`); toast.success('Image supprimée'); fetchVehicles(); }
    catch { toast.error('Erreur'); }
  };

  const filtered = search
    ? vehicles.filter(v => {
        const q = search.toLowerCase();
        return v.model.name.toLowerCase().includes(q) || v.model.brand.name.toLowerCase().includes(q) || v.plateNumber.toLowerCase().includes(q);
      })
    : vehicles;

  const currentModels = selectedBrand ? brands.find(b => b.id === parseInt(selectedBrand))?.models || [] : [];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Véhicules</h1>
          <p className="text-gray-500 text-sm">{vehicles.length} véhicule(s) au total</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2 bg-blue-600 hover:bg-blue-700 rounded-xl">
          <Plus className="h-4 w-4" /> Ajouter
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="pl-10 h-10 rounded-xl" />
      </div>

      {showForm && (
        <Card className="border-0 shadow-lg mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">{editId ? 'Modifier le véhicule' : 'Nouveau véhicule'}</h2>
              <button onClick={() => { setShowForm(false); resetForm(); }}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Marque *</Label>
                  <select value={selectedBrand} onChange={(e) => { setSelectedBrand(e.target.value); setModelId(''); }} className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm">
                    <option value="">Choisir</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Modèle *</Label>
                  <select value={modelId} onChange={(e) => setModelId(e.target.value)} className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm">
                    <option value="">Choisir</option>
                    {currentModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Année</Label>
                  <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} className="h-10 rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Plaque *</Label>
                  <Input value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} placeholder="AB-1234" className="h-10 rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Couleur</Label>
                  <Input value={color} onChange={(e) => setColor(e.target.value)} className="h-10 rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Places</Label>
                  <Input type="number" value={seats} onChange={(e) => setSeats(e.target.value)} className="h-10 rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Kilométrage</Label>
                  <Input type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} placeholder="km" className="h-10 rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Transmission</Label>
                  <select value={transmission} onChange={(e) => setTransmission(e.target.value)} className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm">
                    <option value="MANUAL">Manuelle</option>
                    <option value="AUTOMATIC">Automatique</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Carburant</Label>
                  <select value={fuelType} onChange={(e) => setFuelType(e.target.value)} className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm">
                    <option value="ESSENCE">Essence</option>
                    <option value="DIESEL">Diesel</option>
                    <option value="HYBRID">Hybride</option>
                    <option value="ELECTRIC">Électrique</option>
                  </select>
                </div>
                <div className="flex items-end gap-2 pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="rounded" />
                    <span className="text-sm">En vedette</span>
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Prix/jour (FCFA) *</Label>
                  <Input type="number" value={pricePerDay} onChange={(e) => setPricePerDay(e.target.value)} className="h-10 rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Prix/semaine</Label>
                  <Input type="number" value={pricePerWeek} onChange={(e) => setPricePerWeek(e.target.value)} className="h-10 rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Prix/mois</Label>
                  <Input type="number" value={pricePerMonth} onChange={(e) => setPricePerMonth(e.target.value)} className="h-10 rounded-lg" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Équipements (séparés par des virgules)</Label>
                <Input value={features} onChange={(e) => setFeatures(e.target.value)} placeholder="Climatisation, GPS, Bluetooth..." className="h-10 rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Images du véhicule</Label>
                <div className="flex flex-wrap gap-3 items-center">
                  {previewUrls.map((url, i) => (
                    <div key={i} className="relative group">
                      <img src={url} alt="" className="w-20 h-16 object-cover rounded-lg border border-gray-200" />
                      <button
                        type="button"
                        onClick={() => {
                          URL.revokeObjectURL(url);
                          setNewImages(prev => prev.filter((_, idx) => idx !== i));
                          setPreviewUrls(prev => prev.filter((_, idx) => idx !== i));
                        }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <label className="w-20 h-16 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                    <ImagePlus className="h-5 w-5 text-gray-400" />
                    <span className="text-[9px] text-gray-400 mt-0.5">Ajouter</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (!e.target.files?.length) return;
                        const files = Array.from(e.target.files);
                        setNewImages(prev => [...prev, ...files]);
                        setPreviewUrls(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
                {newImages.length > 0 && <p className="text-xs text-blue-600">{newImages.length} image(s) sélectionnée(s)</p>}
              </div>
              <div className="flex gap-3">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 rounded-xl">{editId ? 'Modifier' : 'Ajouter'}</Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm(); }} className="rounded-xl">Annuler</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {showImages !== null && (
        <ImageManager
          vehicle={vehicles.find(v => v.id === showImages)!}
          onClose={() => setShowImages(null)}
          onUpload={handleImageUpload}
          onDelete={deleteImage}
          uploading={uploading}
        />
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-white rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((v) => {
            const img = v.images.find(i => i.isPrimary) || v.images[0];
            return (
              <Card key={v.id} className="border-0 shadow-sm">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="relative w-20 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    {img ? <Image src={img.url} alt="" fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Car className="h-6 w-6 text-gray-300" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold truncate">{v.model.brand.name} {v.model.name} {v.year}</p>
                      {v.isFeatured && <Star className="h-4 w-4 text-amber-500 fill-amber-500 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                      <span>{v.plateNumber}</span>
                      <span>{v.transmission === 'AUTOMATIC' ? 'Auto' : 'Manuel'}</span>
                      <span>{v.fuelType}</span>
                      <span className="font-semibold text-blue-600">{formatPrice(v.pricePerDay)}/j</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={v.status}
                      onChange={(e) => updateStatus(v.id, e.target.value)}
                      className={`text-xs font-medium px-2 py-1 rounded-lg border-0 ${
                        v.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
                        v.status === 'RENTED' ? 'bg-red-100 text-red-700' :
                        v.status === 'MAINTENANCE' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}
                    >
                      <option value="AVAILABLE">Disponible</option>
                      <option value="RENTED">Loué</option>
                      <option value="MAINTENANCE">Maintenance</option>
                      <option value="UNAVAILABLE">Indisponible</option>
                    </select>
                    <button onClick={() => toggleFeatured(v)} className="p-1.5 rounded-lg hover:bg-gray-100" title="Vedette">
                      {v.isFeatured ? <Star className="h-4 w-4 text-amber-500 fill-amber-500" /> : <StarOff className="h-4 w-4 text-gray-400" />}
                    </button>
                    <button onClick={() => setShowImages(v.id)} className="p-1.5 rounded-lg hover:bg-gray-100" title="Images">
                      <ImageIcon className="h-4 w-4 text-gray-500" />
                    </button>
                    <button onClick={() => openEdit(v)} className="p-1.5 rounded-lg hover:bg-gray-100">
                      <Pencil className="h-4 w-4 text-gray-500" />
                    </button>
                    <button onClick={() => deleteVehicle(v.id)} className="p-1.5 rounded-lg hover:bg-red-50">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <Car className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucun véhicule</p>
        </div>
      )}
    </div>
  );
}

function ImageManager({ vehicle, onClose, onUpload, onDelete, uploading }: {
  vehicle: Vehicle;
  onClose: () => void;
  onUpload: (vehicleId: number, files: FileList) => Promise<void>;
  onDelete: (vehicleId: number, imageId: number) => Promise<void>;
  uploading: boolean;
}) {
  return (
    <Card className="border-0 shadow-lg mb-6">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Images — {vehicle.model.brand.name} {vehicle.model.name}</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-gray-400" /></button>
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          {vehicle.images.map((img) => (
            <div key={img.id} className="relative group">
              <div className="relative w-28 h-20 rounded-lg overflow-hidden">
                <Image src={img.url} alt="" fill className="object-cover" />
              </div>
              {img.isPrimary && <Badge className="absolute -top-1 -left-1 bg-blue-600 text-white border-0 text-[9px] px-1.5">Principal</Badge>}
              <button
                onClick={() => onDelete(vehicle.id, img.id)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {vehicle.images.length === 0 && <p className="text-sm text-gray-400">Aucune image</p>}
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
            <Upload className="h-4 w-4" />
            {uploading ? 'Upload...' : 'Ajouter des images'}
          </div>
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => { if (e.target.files?.length) onUpload(vehicle.id, e.target.files); }}
          />
        </label>
      </CardContent>
    </Card>
  );
}
