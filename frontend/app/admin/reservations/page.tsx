'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarCheck, Phone, Mail, Check, X, Play, CheckCircle, Ban, MessageCircle } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { Reservation } from '@/lib/types';

const WHATSAPP = '23560935774';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'En attente', color: 'bg-amber-100 text-amber-700' },
  CONFIRMED: { label: 'Confirmée', color: 'bg-blue-100 text-blue-700' },
  ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-700' },
  COMPLETED: { label: 'Terminée', color: 'bg-gray-100 text-gray-700' },
  CANCELLED: { label: 'Annulée', color: 'bg-red-100 text-red-700' },
};

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const fetchReservations = useCallback(() => {
    setLoading(true);
    api.get('/api/reservations').then(r => setReservations(r.data.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchReservations(); }, [fetchReservations]);

  const updateStatus = async (id: number, status: string) => {
    try {
      await api.put(`/api/reservations/${id}`, { status });
      toast.success('Statut mis à jour');
      fetchReservations();
    } catch { toast.error('Erreur'); }
  };

  const filtered = filter ? reservations.filter(r => r.status === filter) : reservations;

  const counts = {
    all: reservations.length,
    PENDING: reservations.filter(r => r.status === 'PENDING').length,
    CONFIRMED: reservations.filter(r => r.status === 'CONFIRMED').length,
    ACTIVE: reservations.filter(r => r.status === 'ACTIVE').length,
    COMPLETED: reservations.filter(r => r.status === 'COMPLETED').length,
    CANCELLED: reservations.filter(r => r.status === 'CANCELLED').length,
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Réservations</h1>
        <p className="text-gray-500 text-sm">{reservations.length} réservation(s)</p>
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        <Button variant={filter === '' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('')} className="rounded-lg text-xs">
          Toutes ({counts.all})
        </Button>
        {Object.entries(STATUS_MAP).map(([key, val]) => (
          <Button key={key} variant={filter === key ? 'default' : 'outline'} size="sm" onClick={() => setFilter(key)} className="rounded-lg text-xs">
            {val.label} ({counts[key as keyof typeof counts]})
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-white rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((r) => {
            const st = STATUS_MAP[r.status] || { label: r.status, color: 'bg-gray-100 text-gray-700' };
            const vehicleName = r.vehicle ? `${r.vehicle.model.brand.name} ${r.vehicle.model.name}` : `Véhicule #${r.vehicleId}`;
            const days = Math.max(1, Math.ceil((new Date(r.endDate).getTime() - new Date(r.startDate).getTime()) / 86400000));
            return (
              <Card key={r.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold">{r.clientName}</p>
                        <Badge className={`${st.color} border-0 text-[10px]`}>{st.label}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{vehicleName}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1"><CalendarCheck className="h-3 w-3" />{formatDate(r.startDate)} → {formatDate(r.endDate)} ({days}j)</span>
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{r.clientPhone}</span>
                        {r.clientEmail && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{r.clientEmail}</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm font-semibold text-blue-600">{formatPrice(r.totalPrice)}</span>
                        {r.paidAmount > 0 && <span className="text-xs text-green-600">Payé: {formatPrice(r.paidAmount)}</span>}
                      </div>
                      {r.notes && <p className="text-xs text-gray-400 mt-1">{r.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {r.status === 'PENDING' && (
                        <>
                          <Button size="sm" onClick={() => updateStatus(r.id, 'CONFIRMED')} className="gap-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs">
                            <Check className="h-3 w-3" /> Confirmer
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, 'CANCELLED')} className="gap-1 rounded-lg text-xs text-red-600 hover:text-red-700">
                            <Ban className="h-3 w-3" /> Annuler
                          </Button>
                        </>
                      )}
                      {r.status === 'CONFIRMED' && (
                        <Button size="sm" onClick={() => updateStatus(r.id, 'ACTIVE')} className="gap-1 bg-green-600 hover:bg-green-700 rounded-lg text-xs">
                          <Play className="h-3 w-3" /> Démarrer
                        </Button>
                      )}
                      {r.status === 'ACTIVE' && (
                        <Button size="sm" onClick={() => updateStatus(r.id, 'COMPLETED')} className="gap-1 bg-gray-600 hover:bg-gray-700 rounded-lg text-xs">
                          <CheckCircle className="h-3 w-3" /> Terminer
                        </Button>
                      )}
                      <a href={`https://wa.me/${r.clientPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Bonjour ${r.clientName}, concernant votre réservation du véhicule ${vehicleName}...`)}`} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="gap-1 rounded-lg text-xs text-green-600">
                          <MessageCircle className="h-3 w-3" /> WhatsApp
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
          <p className="text-gray-500">Aucune réservation</p>
        </div>
      )}
    </div>
  );
}
