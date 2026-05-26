'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Car, Search, Fuel, Users, Settings2, SlidersHorizontal, X } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import type { Vehicle, Brand } from '@/lib/types';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function VehiculesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>}>
      <VehiculesContent />
    </Suspense>
  );
}

function VehiculesContent() {
  const searchParams = useSearchParams();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [brandFilter, setBrandFilter] = useState(searchParams.get('brand') || '');
  const [transmissionFilter, setTransmissionFilter] = useState('');
  const [fuelFilter, setFuelFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/brands`).then(r => r.json()).then(d => setBrands(d.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (brandFilter) params.set('brand', brandFilter);
    if (transmissionFilter) params.set('transmission', transmissionFilter);
    if (fuelFilter) params.set('fuel', fuelFilter);
    fetch(`${API}/api/vehicles?${params.toString()}`)
      .then(r => r.json())
      .then(d => setVehicles(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [brandFilter, transmissionFilter, fuelFilter]);

  const filtered = searchQuery
    ? vehicles.filter(v => {
        const q = searchQuery.toLowerCase();
        return v.model.name.toLowerCase().includes(q) || v.model.brand.name.toLowerCase().includes(q) || (v.color || '').toLowerCase().includes(q);
      })
    : vehicles;

  const clearFilters = () => { setBrandFilter(''); setTransmissionFilter(''); setFuelFilter(''); setSearchQuery(''); };
  const hasFilters = brandFilter || transmissionFilter || fuelFilter || searchQuery;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-2">Nos véhicules</h1>
          <p className="text-muted-foreground">Trouvez la voiture idéale pour vos besoins</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher une marque, un modèle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl"
            />
          </div>
          <Button variant="outline" className="gap-2 rounded-xl h-11" onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal className="h-4 w-4" /> Filtres
            {hasFilters && <Badge className="bg-blue-600 text-white border-0 ml-1 text-[10px] px-1.5">!</Badge>}
          </Button>
        </div>

        {showFilters && (
          <Card className="border-0 shadow-sm mb-6">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">Filtres</h3>
                {hasFilters && (
                  <button onClick={clearFilters} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                    <X className="h-3 w-3" /> Réinitialiser
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Marque</label>
                  <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)} className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm">
                    <option value="">Toutes les marques</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Transmission</label>
                  <select value={transmissionFilter} onChange={(e) => setTransmissionFilter(e.target.value)} className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm">
                    <option value="">Toutes</option>
                    <option value="MANUAL">Manuelle</option>
                    <option value="AUTOMATIC">Automatique</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Carburant</label>
                  <select value={fuelFilter} onChange={(e) => setFuelFilter(e.target.value)} className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm">
                    <option value="">Tous</option>
                    <option value="ESSENCE">Essence</option>
                    <option value="DIESEL">Diesel</option>
                    <option value="HYBRID">Hybride</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">{filtered.length} véhicule(s)</p>
          {hasFilters && (
            <div className="flex gap-2 flex-wrap">
              {brandFilter && <Badge className="bg-blue-100 text-blue-700 border-0 text-xs cursor-pointer" onClick={() => setBrandFilter('')}>{brands.find(b => b.id === parseInt(brandFilter))?.name} ×</Badge>}
              {transmissionFilter && <Badge className="bg-blue-100 text-blue-700 border-0 text-xs cursor-pointer" onClick={() => setTransmissionFilter('')}>{transmissionFilter === 'MANUAL' ? 'Manuelle' : 'Auto'} ×</Badge>}
              {fuelFilter && <Badge className="bg-blue-100 text-blue-700 border-0 text-xs cursor-pointer" onClick={() => setFuelFilter('')}>{fuelFilter} ×</Badge>}
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm animate-pulse">
                <div className="h-52 bg-gray-200 rounded-t-xl" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-6 bg-gray-200 rounded w-2/3" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((v) => {
              const img = v.images.find(i => i.isPrimary) || v.images[0];
              return (
                <Link key={v.id} href={`/vehicules/${v.id}`}>
                  <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                    <Card className="border-0 shadow-lg overflow-hidden group cursor-pointer h-full">
                      <div className="relative h-52 bg-gray-100">
                        {img ? (
                          <Image src={img.url} alt={`${v.model.brand.name} ${v.model.name}`} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Car className="h-16 w-16 text-gray-300" /></div>
                        )}
                        <Badge className={`absolute top-3 left-3 border-0 text-xs ${v.status === 'AVAILABLE' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                          {v.status === 'AVAILABLE' ? 'Disponible' : v.status === 'RENTED' ? 'Loué' : 'Indisponible'}
                        </Badge>
                      </div>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-xs text-blue-600 font-semibold">{v.model.brand.name}</p>
                            <h3 className="font-bold text-lg text-gray-900">{v.model.name} {v.year}</h3>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-extrabold text-blue-600">{formatPrice(v.pricePerDay)}</p>
                            <p className="text-xs text-gray-400">/jour</p>
                          </div>
                        </div>
                        {v.color && <p className="text-xs text-gray-400 mb-2">Couleur : {v.color}</p>}
                        <div className="flex items-center gap-4 text-xs text-gray-500 pt-3 border-t border-gray-100">
                          <span className="flex items-center gap-1"><Settings2 className="h-3.5 w-3.5" />{v.transmission === 'AUTOMATIC' ? 'Auto' : 'Manuel'}</span>
                          <span className="flex items-center gap-1"><Fuel className="h-3.5 w-3.5" />{v.fuelType}</span>
                          <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{v.seats} pl.</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <Car className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium text-lg">Aucun véhicule trouvé</p>
            <p className="text-sm text-gray-400 mt-1">Essayez de modifier vos filtres</p>
            {hasFilters && <Button variant="outline" className="mt-4" onClick={clearFilters}>Réinitialiser les filtres</Button>}
          </div>
        )}
      </div>
    </div>
  );
}
