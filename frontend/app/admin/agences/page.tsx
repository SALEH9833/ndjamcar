'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, Plus, Pencil, Trash2, Users, Car, CalendarCheck, X, UserPlus, Eye, EyeOff, Phone, Mail, MapPin } from 'lucide-react';
import api from '@/lib/api';
import type { Agency } from '@/lib/types';

export default function AgencesPage() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Agency | null>(null);
  const [showAdminForm, setShowAdminForm] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', phone: '', email: '', address: '', city: '', whatsapp: '' });
  const [adminForm, setAdminForm] = useState({ username: '', password: '', email: '' });
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/api/agencies').then(r => setAgencies(r.data.data || [])).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleSubmit = async () => {
    setError('');
    try {
      if (editing) {
        await api.put(`/api/agencies/${editing.id}`, form);
      } else {
        await api.post('/api/agencies', { ...form, slug: form.slug || generateSlug(form.name) });
      }
      setShowForm(false);
      setEditing(null);
      setForm({ name: '', slug: '', phone: '', email: '', address: '', city: '', whatsapp: '' });
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette agence ?')) return;
    try {
      await api.delete(`/api/agencies/${id}`);
      load();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erreur');
    }
  };

  const toggleActive = async (agency: Agency) => {
    await api.put(`/api/agencies/${agency.id}`, { isActive: !agency.isActive });
    load();
  };

  const handleAddAdmin = async (agencyId: number) => {
    setError('');
    try {
      await api.post(`/api/agencies/${agencyId}/admin`, adminForm);
      setShowAdminForm(null);
      setAdminForm({ username: '', password: '', email: '' });
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur');
    }
  };

  const handleDeleteAdmin = async (agencyId: number, adminId: number) => {
    if (!confirm('Supprimer cet admin ?')) return;
    try {
      await api.delete(`/api/agencies/${agencyId}/admin/${adminId}`);
      load();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erreur');
    }
  };

  const openEdit = (agency: Agency) => {
    setEditing(agency);
    setForm({
      name: agency.name,
      slug: agency.slug,
      phone: agency.phone || '',
      email: agency.email || '',
      address: agency.address || '',
      city: agency.city || '',
      whatsapp: agency.whatsapp || '',
    });
    setShowForm(true);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', slug: '', phone: '', email: '', address: '', city: '', whatsapp: '' });
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-blue-600" />
            Agences ({agencies.length})
          </h1>
          <p className="text-gray-500 text-sm">Gérer les agences de location</p>
        </div>
        <Button onClick={openCreate} className="gap-2 rounded-xl">
          <Plus className="h-4 w-4" /> Nouvelle agence
        </Button>
      </div>

      {showForm && (
        <Card className="border-0 shadow-md mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">{editing ? 'Modifier l\'agence' : 'Nouvelle agence'}</h3>
              <button onClick={() => { setShowForm(false); setEditing(null); }}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Nom *</label>
                <Input value={form.name} onChange={e => { setForm({ ...form, name: e.target.value, slug: form.slug || generateSlug(e.target.value) }); }} placeholder="Nom de l'agence" className="rounded-lg" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Slug *</label>
                <Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="nom-agence" className="rounded-lg" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Téléphone</label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+235..." className="rounded-lg" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Email</label>
                <Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="contact@agence.com" className="rounded-lg" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">WhatsApp</label>
                <Input value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} placeholder="+235..." className="rounded-lg" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Ville</label>
                <Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="N'Djamena" className="rounded-lg" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-gray-500 mb-1 block">Adresse</label>
                <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Adresse complète" className="rounded-lg" />
              </div>
            </div>
            <div className="flex gap-3 mt-4 justify-end">
              <Button variant="outline" onClick={() => { setShowForm(false); setEditing(null); }} className="rounded-xl">Annuler</Button>
              <Button onClick={handleSubmit} className="rounded-xl">{editing ? 'Modifier' : 'Créer'}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white rounded-xl animate-pulse" />)}
        </div>
      ) : agencies.length === 0 ? (
        <div className="text-center py-20">
          <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Aucune agence</p>
          <p className="text-sm text-gray-400 mt-1">Créez votre première agence</p>
        </div>
      ) : (
        <div className="space-y-4">
          {agencies.map(agency => (
            <Card key={agency.id} className={`border-0 shadow-sm ${!agency.isActive ? 'opacity-60' : ''}`}>
              <CardContent className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{agency.name}</h3>
                        <p className="text-xs text-gray-400">/{agency.slug}</p>
                      </div>
                      <Badge className={`border-0 text-xs ${agency.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {agency.isActive ? 'Active' : 'Désactivée'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500 mt-2">
                      {agency.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{agency.phone}</span>}
                      {agency.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{agency.email}</span>}
                      {agency.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{agency.city}</span>}
                    </div>
                    <div className="flex gap-4 mt-3">
                      <span className="flex items-center gap-1.5 text-xs bg-gray-100 px-2.5 py-1 rounded-full">
                        <Car className="h-3 w-3 text-blue-600" /> {agency._count?.vehicles || 0} véhicules
                      </span>
                      <span className="flex items-center gap-1.5 text-xs bg-gray-100 px-2.5 py-1 rounded-full">
                        <Users className="h-3 w-3 text-purple-600" /> {agency._count?.admins || 0} admins
                      </span>
                      <span className="flex items-center gap-1.5 text-xs bg-gray-100 px-2.5 py-1 rounded-full">
                        <CalendarCheck className="h-3 w-3 text-green-600" /> {agency._count?.reservations || 0} réservations
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 shrink-0">
                    <Button variant="outline" size="sm" className="gap-1.5 rounded-lg text-xs" onClick={() => setShowAdminForm(showAdminForm === agency.id ? null : agency.id)}>
                      <UserPlus className="h-3.5 w-3.5" /> Admin
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5 rounded-lg text-xs" onClick={() => toggleActive(agency)}>
                      {agency.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      {agency.isActive ? 'Désactiver' : 'Activer'}
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5 rounded-lg text-xs" onClick={() => openEdit(agency)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5 rounded-lg text-xs text-red-500 hover:text-red-700" onClick={() => handleDelete(agency.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {showAdminForm === agency.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-semibold mb-3">Ajouter un admin pour {agency.name}</h4>
                    {error && <div className="bg-red-50 text-red-600 text-sm p-2 rounded-lg mb-3">{error}</div>}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Input value={adminForm.username} onChange={e => setAdminForm({ ...adminForm, username: e.target.value })} placeholder="Nom d'utilisateur" className="rounded-lg h-9 text-sm" />
                      <Input type="password" value={adminForm.password} onChange={e => setAdminForm({ ...adminForm, password: e.target.value })} placeholder="Mot de passe" className="rounded-lg h-9 text-sm" />
                      <Input value={adminForm.email} onChange={e => setAdminForm({ ...adminForm, email: e.target.value })} placeholder="Email (optionnel)" className="rounded-lg h-9 text-sm" />
                      <div className="flex gap-2">
                        <Button size="sm" className="rounded-lg" onClick={() => handleAddAdmin(agency.id)}>Créer</Button>
                        <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setShowAdminForm(null)}>Annuler</Button>
                      </div>
                    </div>
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
