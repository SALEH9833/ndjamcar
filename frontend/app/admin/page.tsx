'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CarFront, CalendarCheck, MessageSquare, TrendingUp, AlertCircle, MapPin, Search, Download, Phone, Mail, Car } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import api from '@/lib/api';
import type { Vehicle, Reservation } from '@/lib/types';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [rentedVehicles, setRentedVehicles] = useState<Vehicle[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [transmissionFilter, setTransmissionFilter] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/api/vehicles/stats').then(r => r.data.data).catch(() => null),
      api.get('/api/reservations').then(r => r.data).catch(() => null),
      api.get('/api/contact').then(r => r.data).catch(() => null),
      api.get('/api/vehicles/all').then(r => r.data.data || []).catch(() => []),
    ]).then(([vehicleStats, resData, messages, allVehicles]) => {
      const resList = resData?.data || [];
      const msgData = messages?.data || [];
      setStats({
        totalVehicles: vehicleStats?.total || 0,
        availableVehicles: vehicleStats?.available || 0,
        rentedVehicles: vehicleStats?.rented || 0,
        totalReservations: resList.length,
        pendingReservations: resList.filter((r: any) => r.status === 'PENDING').length,
        activeReservations: resList.filter((r: any) => r.status === 'ACTIVE').length,
        unreadMessages: msgData.filter((m: any) => !m.isRead).length,
      });
      setRentedVehicles(allVehicles.filter((v: Vehicle) => v.status === 'RENTED'));
      setReservations(resList.filter((r: Reservation) => ['ACTIVE', 'CONFIRMED'].includes(r.status)));
    });
  }, []);

  const brands = [...new Set(rentedVehicles.map(v => v.model.brand.name))];

  const filteredRented = rentedVehicles.filter(v => {
    if (search) {
      const q = search.toLowerCase();
      if (!v.model.name.toLowerCase().includes(q) && !v.model.brand.name.toLowerCase().includes(q) && !v.plateNumber.toLowerCase().includes(q)) return false;
    }
    if (brandFilter && v.model.brand.name !== brandFilter) return false;
    if (transmissionFilter && v.transmission !== transmissionFilter) return false;
    return true;
  });

  const getReservationForVehicle = (vehicleId: number) => reservations.find(r => r.vehicleId === vehicleId);

  const exportCSV = () => {
    const headers = ['Marque', 'Modele', 'Annee', 'Plaque', 'Couleur', 'Transmission', 'Carburant', 'Places', 'Prix/jour', 'Client', 'Telephone', 'Email', 'Date debut', 'Date fin', 'Jours', 'Total'];
    const rows = filteredRented.map(v => {
      const res = getReservationForVehicle(v.id);
      const days = res ? Math.max(1, Math.ceil((new Date(res.endDate).getTime() - new Date(res.startDate).getTime()) / 86400000)) : '';
      return [v.model.brand.name, v.model.name, v.year, v.plateNumber, v.color || '', v.transmission === 'AUTOMATIC' ? 'Automatique' : 'Manuelle', v.fuelType, v.seats, v.pricePerDay, res?.clientName || '', res?.clientPhone || '', res?.clientEmail || '', res ? formatDate(res.startDate) : '', res ? formatDate(res.endDate) : '', days, res?.totalPrice || ''].join(';');
    });
    const csv = [headers.join(';'), ...rows].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vehicules_loues_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!stats) return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 7 }).map((_, i) => <div key={i} className="h-28 bg-white rounded-xl animate-pulse" />)}
    </div>
  );

  const cards = [
    { label: 'Total véhicules', value: stats.totalVehicles, icon: CarFront, color: 'bg-blue-50 text-blue-600', href: '/admin/vehicules' },
    { label: 'Disponibles', value: stats.availableVehicles, icon: CarFront, color: 'bg-green-50 text-green-600', href: '/admin/vehicules' },
    { label: 'En location', value: stats.rentedVehicles, icon: MapPin, color: 'bg-orange-50 text-orange-600', href: '/admin/tracking' },
    { label: 'Réservations', value: stats.totalReservations, icon: CalendarCheck, color: 'bg-purple-50 text-purple-600', href: '/admin/reservations' },
    { label: 'En attente', value: stats.pendingReservations, icon: AlertCircle, color: 'bg-amber-50 text-amber-600', href: '/admin/reservations' },
    { label: 'Actives', value: stats.activeReservations, icon: TrendingUp, color: 'bg-teal-50 text-teal-600', href: '/admin/reservations' },
    { label: 'Messages non lus', value: stats.unreadMessages, icon: MessageSquare, color: 'bg-red-50 text-red-600', href: '/admin/messages' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500 text-sm">Vue d&apos;ensemble de votre activité</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-8">
        {cards.map((card) => (
          <Link key={card.label} href={card.href}>
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${card.color}`}>
                  <card.icon className="h-4 w-4" />
                </div>
                <p className="text-xl font-bold">{card.value}</p>
                <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{card.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Car className="h-5 w-5 text-orange-600" />
              Véhicules en location ({filteredRented.length})
            </h2>
            <p className="text-xs text-gray-500">Véhicules actuellement loués avec infos client</p>
          </div>
          <Button onClick={exportCSV} variant="outline" className="gap-2 rounded-xl text-xs">
            <Download className="h-4 w-4" /> Exporter CSV
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher véhicule, plaque..." className="pl-10 h-9 rounded-lg text-sm" />
          </div>
          <div className="flex gap-2">
            <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)} className="h-9 rounded-lg border border-gray-200 px-3 text-xs">
              <option value="">Toutes marques</option>
              {brands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <select value={transmissionFilter} onChange={(e) => setTransmissionFilter(e.target.value)} className="h-9 rounded-lg border border-gray-200 px-3 text-xs">
              <option value="">Transmission</option>
              <option value="MANUAL">Manuelle</option>
              <option value="AUTOMATIC">Auto</option>
            </select>
            {(search || brandFilter || transmissionFilter) && (
              <button onClick={() => { setSearch(''); setBrandFilter(''); setTransmissionFilter(''); }} className="text-xs text-blue-600 hover:underline px-2 whitespace-nowrap">
                Réinitialiser
              </button>
            )}
          </div>
        </div>

        {filteredRented.length > 0 ? (
          <div className="space-y-3">
            {filteredRented.map((v) => {
              const res = getReservationForVehicle(v.id);
              const days = res ? Math.max(1, Math.ceil((new Date(res.endDate).getTime() - new Date(res.startDate).getTime()) / 86400000)) : 0;
              return (
                <Card key={v.id} className="border-0 shadow-sm border-l-4 border-l-orange-500">
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold">{v.model.brand.name} {v.model.name} {v.year}</p>
                          <Badge className="bg-orange-100 text-orange-700 border-0 text-[10px]">Loué</Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                          <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">{v.plateNumber}</span>
                          <span>{v.transmission === 'AUTOMATIC' ? 'Auto' : 'Manuel'}</span>
                          <span>{v.fuelType}</span>
                          <span>{v.seats} places</span>
                          {v.color && <span>Couleur: {v.color}</span>}
                          <span className="font-semibold text-blue-600">{formatPrice(v.pricePerDay)}/jour</span>
                        </div>
                      </div>
                      {res ? (
                        <div className="lg:text-right space-y-1 shrink-0">
                          <p className="font-semibold text-sm">{res.clientName}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 lg:justify-end">
                            <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{res.clientPhone}</span>
                            {res.clientEmail && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{res.clientEmail}</span>}
                          </div>
                          <div className="flex items-center gap-2 text-xs lg:justify-end">
                            <span className="text-gray-500">{formatDate(res.startDate)} → {formatDate(res.endDate)}</span>
                            <Badge className="bg-blue-100 text-blue-700 border-0 text-[10px]">{days}j</Badge>
                          </div>
                          <p className="text-sm font-bold text-blue-600">{formatPrice(res.totalPrice)}</p>
                        </div>
                      ) : (
                        <div className="lg:text-right">
                          <p className="text-xs text-gray-400">Pas de réservation associée</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Car className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {rentedVehicles.length === 0 ? 'Aucun véhicule en location' : 'Aucun résultat pour ces filtres'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
