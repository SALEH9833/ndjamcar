'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, Check, X, Phone, Mail, MapPin, Car, Clock, MessageSquare, Trash2, User, Users, Plus, Minus } from 'lucide-react';
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
  adminCount: number;
  adminNames: string | null;
  description: string | null;
  status: string;
  adminNotes: string | null;
  createdAt: string;
}

interface AdminEntry {
  username: string;
  password: string;
  email: string;
}

export default function DemandesPage() {
  const [requests, setRequests] = useState<AgencyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');
  const [approving, setApproving] = useState<number | null>(null);
  const [adminEntries, setAdminEntries] = useState<AdminEntry[]>([{ username: '', password: '', email: '' }]);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    const params = filter ? `?status=${filter}` : '';
    api.get(`/api/agency-requests${params}`).then(r => setRequests(r.data.data || [])).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const startApprove = (req: AgencyRequest) => {
    const count = req.adminCount || 1;
    const entries: AdminEntry[] = [];
    for (let i = 0; i < count; i++) {
      entries.push({ username: '', password: '', email: '' });
    }
    setAdminEntries(entries);
    setApproving(req.id);
    setError('');
  };

  const updateAdminEntry = (index: number, field: keyof AdminEntry, value: string) => {
    const updated = [...adminEntries];
    updated[index] = { ...updated[index], [field]: value };
    setAdminEntries(updated);
  };

  const addAdminEntry = () => {
    setAdminEntries([...adminEntries, { username: '', password: '', email: '' }]);
  };

  const removeAdminEntry = (index: number) => {
    if (adminEntries.length <= 1) return;
    setAdminEntries(adminEntries.filter((_, i) => i !== index));
  };

  const handleApprove = async (id: number) => {
    setError('');
    const invalid = adminEntries.find(a => !a.username || !a.password);
    if (invalid) { setError('Chaque admin doit avoir un nom d\'utilisateur et un mot de passe'); return; }
    try {
      await api.put(`/api/agency-requests/${id}/approve`, { admins: adminEntries });
      setApproving(null);
      setAdminEntries([{ username: '', password: '', email: '' }]);
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
                      <span className="flex items-center gap-1 font-semibold text-blue-600"><Users className="h-3 w-3" />{req.adminCount} admin(s)</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDate(req.createdAt)}</span>
                    </div>
                    {req.address && <p className="text-xs text-gray-400 mt-1">{req.address}</p>}
                    {req.adminNames && (
                      <div className="mt-2 bg-blue-50 rounded-lg p-2.5">
                        <p className="text-[10px] font-semibold text-blue-700 mb-1">Administrateurs demandés :</p>
                        <p className="text-xs text-blue-600 whitespace-pre-line">{req.adminNames}</p>
                      </div>
                    )}
                    {req.description && (
                      <div className="mt-2 bg-gray-50 rounded-lg p-3">
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
                        <Button size="sm" className="gap-1.5 rounded-lg text-xs" onClick={() => startApprove(req)}>
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
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        Créer {adminEntries.length} compte(s) admin pour {req.name}
                      </h4>
                      <Button variant="outline" size="sm" className="gap-1 rounded-lg text-xs" onClick={addAdminEntry}>
                        <Plus className="h-3 w-3" /> Ajouter
                      </Button>
                    </div>
                    {error && <div className="bg-red-50 text-red-600 text-sm p-2 rounded-lg mb-3">{error}</div>}

                    <div className="space-y-3">
                      {adminEntries.map((entry, i) => (
                        <div key={i} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-gray-50 p-3 rounded-lg">
                          <span className="text-xs font-bold text-gray-500 w-20 shrink-0">Admin {i + 1}</span>
                          <Input
                            value={entry.username}
                            onChange={e => updateAdminEntry(i, 'username', e.target.value)}
                            placeholder="Nom d'utilisateur"
                            className="rounded-lg h-8 text-xs flex-1"
                          />
                          <Input
                            type="password"
                            value={entry.password}
                            onChange={e => updateAdminEntry(i, 'password', e.target.value)}
                            placeholder="Mot de passe"
                            className="rounded-lg h-8 text-xs flex-1"
                          />
                          <Input
                            value={entry.email}
                            onChange={e => updateAdminEntry(i, 'email', e.target.value)}
                            placeholder="Email (optionnel)"
                            className="rounded-lg h-8 text-xs flex-1"
                          />
                          {adminEntries.length > 1 && (
                            <button onClick={() => removeAdminEntry(i)} className="text-red-400 hover:text-red-600 p-1">
                              <Minus className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 mt-4 justify-end">
                      <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setApproving(null)}>Annuler</Button>
                      <Button size="sm" className="rounded-lg gap-1.5" onClick={() => handleApprove(req.id)}>
                        <Check className="h-3.5 w-3.5" /> Confirmer et créer l&apos;agence
                      </Button>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2">Tous les comptes seront liés à l&apos;agence &quot;{req.name}&quot;. Communiquez les identifiants à chaque admin.</p>
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
