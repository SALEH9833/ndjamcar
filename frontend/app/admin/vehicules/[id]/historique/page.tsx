'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CalendarCheck, Phone, Mail, TrendingUp, Hash, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import api from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'En attente', color: 'bg-amber-100 text-amber-700' },
  CONFIRMED: { label: 'Confirmée', color: 'bg-blue-100 text-blue-700' },
  ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-700' },
  COMPLETED: { label: 'Terminée', color: 'bg-gray-100 text-gray-700' },
  CANCELLED: { label: 'Annulée', color: 'bg-red-100 text-red-700' },
  EXPIRED: { label: 'Expirée', color: 'bg-orange-100 text-orange-700' },
};

interface VehicleHistory {
  vehicle: {
    id: number;
    plateNumber: string;
    model: { name: string; brand: { name: string } };
  };
  reservations: {
    id: number;
    clientName: string;
    clientPhone: string;
    clientEmail: string | null;
    startDate: string;
    endDate: string;
    totalPrice: number;
    paidAmount: number;
    status: string;
    notes: string | null;
    createdAt: string;
  }[];
  stats: {
    total: number;
    completed: number;
    cancelled: number;
    totalRevenue: number;
  };
}

export default function VehicleHistoryPage() {
  const { id } = useParams();
  const [data, setData] = useState<VehicleHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    api.get(`/api/vehicles/${id}/reservations`)
      .then(r => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="space-y-4">
      <div className="h-8 bg-gray-200 rounded w-64 animate-pulse" />
      <div className="h-24 bg-gray-200 rounded-xl animate-pulse" />
      <div className="h-24 bg-gray-200 rounded-xl animate-pulse" />
    </div>
  );

  if (!data) return (
    <div className="text-center py-20">
      <p className="text-gray-500">Véhicule introuvable</p>
      <Link href="/admin/vehicules"><Button variant="outline" className="mt-4">Retour</Button></Link>
    </div>
  );

  const { vehicle, reservations, stats } = data;
  const vehicleName = `${vehicle.model.brand.name} ${vehicle.model.name}`;
  const filtered = filterStatus ? reservations.filter(r => r.status === filterStatus) : reservations;

  const token = typeof window !== 'undefined' ? localStorage.getItem('ndjamcar_token') || '' : '';

  return (
    <div>
      <Link href="/admin/vehicules" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4">
        <ArrowLeft className="h-4 w-4" /> Retour aux véhicules
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">{vehicleName}</h1>
        <p className="text-gray-500 text-sm">{vehicle.plateNumber} — Historique des réservations</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <Hash className="h-5 w-5 text-blue-600 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-gray-500">Réservations</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats.completed}</p>
            <p className="text-xs text-gray-500">Terminées</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <XCircle className="h-5 w-5 text-red-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats.cancelled}</p>
            <p className="text-xs text-gray-500">Annulées</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-emerald-600">{formatPrice(stats.totalRevenue)}</p>
            <p className="text-xs text-gray-500">Revenus</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        <Button variant={filterStatus === '' ? 'default' : 'outline'} size="sm" onClick={() => setFilterStatus('')} className="rounded-lg text-xs">
          Toutes ({reservations.length})
        </Button>
        {Object.entries(STATUS_MAP).map(([key, val]) => {
          const count = reservations.filter(r => r.status === key).length;
          if (count === 0) return null;
          return (
            <Button key={key} variant={filterStatus === key ? 'default' : 'outline'} size="sm" onClick={() => setFilterStatus(key)} className="rounded-lg text-xs">
              {val.label} ({count})
            </Button>
          );
        })}
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((r) => {
            const st = STATUS_MAP[r.status] || { label: r.status, color: 'bg-gray-100 text-gray-700' };
            const days = Math.max(1, Math.ceil((new Date(r.endDate).getTime() - new Date(r.startDate).getTime()) / 86400000));
            const rest = r.totalPrice - r.paidAmount;
            return (
              <Card key={r.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold">{r.clientName}</p>
                        <Badge className={`${st.color} border-0 text-[10px]`}>{st.label}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1"><CalendarCheck className="h-3 w-3" />{formatDate(r.startDate)} → {formatDate(r.endDate)} ({days}j)</span>
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{r.clientPhone}</span>
                        {r.clientEmail && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{r.clientEmail}</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm font-semibold text-blue-600">{formatPrice(r.totalPrice)}</span>
                        {r.paidAmount > 0 && <span className="text-xs text-green-600">Payé : {formatPrice(r.paidAmount)}</span>}
                        {rest > 0 && r.status !== 'CANCELLED' && <span className="text-xs text-red-500">Reste : {formatPrice(rest)}</span>}
                      </div>
                      {r.notes && <p className="text-xs text-gray-400 mt-1">{r.notes}</p>}
                      <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Créée le {formatDate(r.createdAt)}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <a href={`${API}/api/reservations/${r.id}/invoice?token=${token}`} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="gap-1 rounded-lg text-xs text-blue-600">
                          <FileText className="h-3 w-3" /> Facture
                        </Button>
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <CalendarCheck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucune réservation pour ce véhicule</p>
        </div>
      )}
    </div>
  );
}
