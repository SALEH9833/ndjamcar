'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, Check, X, Phone, Mail, MapPin, Car, Clock, MessageSquare, Trash2, User } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import api from '@/lib/api';

interface AgencyRequest {
  id: number;
  name: string;
  ownerName: string;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  city: string | null;
  address: string | null;
  vehicleCount: number;
  description: string | null;
  status: string;
  adminNotes: string | null;
  createdAt: string;
}

export default function DemandesPage() {
  const [requests, setRequests] = useState<AgencyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');
  const [approving, setApproving] = useState<number | null>(null);
  const [approveForm, setApproveForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    const params = filter ? `?status=${filter}` : '';
    api.get(`/api/agency-requests${params}`).then(r => setRequests(r.data.data || [])).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const handleApprove = async (id: number) => {
    setError('');
    if (!approveForm.username || !approveForm.password) { setError('Username et mot de passe requis'); return; }
    try {
      await api.put(`/api/agency-requests/${id}/approve`, approveForm);
      setApproving(null);
      setApproveForm({ username: '', password: '' });
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur');
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm('Rejeter cette demande ?')) return;
    try {
      await api.put(`/api/agency-requests/${id}/reject`);
      load();
    } catch {}
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette demande ?')) return;
    try {
      await api.delete(`/api/agency-requests/${id}`);
      load();
    } catch {}
  };

  const statusColors: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
  };

  const statusLabels: Record<string, string> = {
    PENDING: 'En attente',
    APPROVED: 'Approuvée',
    REJECTED: 'Rejetée',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-amber-600" />
            Demandes d&apos;agences
          </h1>
          <p className="text-gray-500 text-sm">Demandes d&apos;inscription des nouvelles agences</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {[
          { value: 'PENDING', label: 'En attente' },
          { value: 'APPROVED', label: 'Approuvées' },
          { value: 'REJECTED', label: 'Rejetées' },
          { value: '', label: 'Toutes' },
        ].map(f => (
          <Button
            key={f.value}
            variant={filter === f.value ? 'default' : 'outline'}
            size="sm"
            className="rounded-lg text-xs"
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-40 bg-white rounded-xl animate-pulse" />)}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20">
          <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Aucune demande</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(req => (
            <Card key={req.id} className={`border-0 shadow-sm ${req.status === 'PENDING' ? 'border-l-4 border-l-amber-500' : ''}`}>
              <CardContent className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg">{req.name}</h3>
                      <Badge className={`border-0 text-xs ${statusColors[req.status]}`}>
                        {statusLabels[req.status]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <User className="h-3.5 w-3.5" />
                      <span className="font-medium">{req.ownerName}</span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{req.phone}</span>
                      {req.whatsapp && req.whatsapp !== req.phone && (
                        <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{req.whatsapp}</span>
                      )}
                      {req.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{req.email}</span>}
                      {req.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{req.city}</span>}
                      {req.vehicleCount > 0 && <span className="flex items-center gap-1"><Car className="h-3 w-3" />{req.vehicleCount} véhicules</span>}
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDate(req.createdAt)}</span>
                    </div>
                    {req.address && <p className="text-xs text-gray-400 mt-1">{req.address}</p>}
                    {req.description && (
                      <div className="mt-3 bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600">{req.description}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 shrink-0">
                    {req.status === 'PENDING' && (
                      <>
                        <a href={`https://wa.me/${(req.whatsapp || req.phone).replace(/[^0-9+]/g, '')}`} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="gap-1.5 rounded-lg text-xs bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
                            <MessageSquare className="h-3.5 w-3.5" /> WhatsApp
                          </Button>
                        </a>
                        <Button size="sm" className="gap-1.5 rounded-lg text-xs" onClick={() => setApproving(approving === req.id ? null : req.id)}>
                          <Check className="h-3.5 w-3.5" /> Approuver
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1.5 rounded-lg text-xs text-red-500 hover:text-red-700" onClick={() => handleReject(req.id)}>
                          <X className="h-3.5 w-3.5" /> Rejeter
                        </Button>
                      </>
                    )}
                    <Button variant="outline" size="sm" className="gap-1.5 rounded-lg text-xs text-gray-400" onClick={() => handleDelete(req.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {approving === req.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-semibold mb-3">Créer le compte admin pour {req.name}</h4>
                    {error && <div className="bg-red-50 text-red-600 text-sm p-2 rounded-lg mb-3">{error}</div>}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Input
                        value={approveForm.username}
                        onChange={e => setApproveForm({ ...approveForm, username: e.target.value })}
                        placeholder="Nom d'utilisateur"
                        className="rounded-lg h-9 text-sm"
                      />
                      <Input
                        type="password"
                        value={approveForm.password}
                        onChange={e => setApproveForm({ ...approveForm, password: e.target.value })}
                        placeholder="Mot de passe"
                        className="rounded-lg h-9 text-sm"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" className="rounded-lg" onClick={() => handleApprove(req.id)}>Confirmer</Button>
                        <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setApproving(null)}>Annuler</Button>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2">Ces identifiants seront communiqués à l&apos;agence pour se connecter</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
