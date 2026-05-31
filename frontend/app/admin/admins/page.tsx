'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, UserPlus, Trash2, Mail, Clock, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import api from '@/lib/api';

interface Admin {
  id: number;
  username: string;
  email: string | null;
  lastLogin: string | null;
  mustChangePassword: boolean;
  createdAt: string;
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [tempPassword, setTempPassword] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/api/auth/admins')
      .then(r => setAdmins(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim()) { toast.error('Le nom d\'utilisateur et l\'email sont requis'); return; }
    setSaving(true);
    try {
      const { data } = await api.post('/api/auth/admins', { username: username.trim(), email: email.trim() });
      if (data.tempPassword) setTempPassword(data.tempPassword);
      toast.success('Admin créé !');
      setUsername('');
      setEmail('');
      setShowForm(false);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (admin: Admin) => {
    if (!confirm(`Supprimer l'administrateur "${admin.username}" ?`)) return;
    try {
      await api.delete(`/api/auth/admins/${admin.id}`);
      toast.success('Administrateur supprimé');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            Administrateurs
          </h1>
          <p className="text-gray-500 text-sm">Gérez les comptes administrateurs</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2 rounded-xl bg-blue-600 hover:bg-blue-700">
          {showForm ? <><X className="h-4 w-4" /> Annuler</> : <><UserPlus className="h-4 w-4" /> Nouvel admin</>}
        </Button>
      </div>

      {tempPassword && (
        <Card className="border-0 shadow-lg mb-6 border-l-4 border-l-green-500">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Administrateur créé avec succès
                </h3>
                <p className="text-sm text-gray-500 mt-2">Voici le mot de passe temporaire (notez-le maintenant) :</p>
                <div className="mt-3 bg-gray-100 dark:bg-gray-800 rounded-xl p-4 flex items-center gap-3">
                  <code className="text-lg font-mono font-bold text-blue-600 select-all">{tempPassword}</code>
                  <Button size="sm" variant="outline" className="rounded-lg text-xs" onClick={() => { navigator.clipboard.writeText(tempPassword); toast.success('Copié !'); }}>
                    Copier
                  </Button>
                </div>
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Ce mot de passe ne sera plus affiché. L&apos;admin devra le changer à la première connexion.
                </p>
              </div>
              <button onClick={() => setTempPassword('')} className="p-1"><X className="h-4 w-4 text-gray-400" /></button>
            </div>
          </CardContent>
        </Card>
      )}

      {showForm && (
        <Card className="border-0 shadow-sm mb-6 border-l-4 border-l-blue-500">
          <CardContent className="p-5">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-blue-600" />
              Créer un administrateur
            </h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Nom d&apos;utilisateur *</Label>
                  <Input
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="ex: ahmed"
                    className="h-10 rounded-lg"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Email *</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="ahmed@example.com"
                    className="h-10 rounded-lg"
                  />
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-blue-700 leading-relaxed">
                  <strong>Comment ça marche :</strong> Un mot de passe temporaire sera généré automatiquement et envoyé par email à l&apos;administrateur.
                  Il devra le changer lors de sa première connexion.
                </p>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={saving} className="gap-2 rounded-xl bg-blue-600 hover:bg-blue-700">
                  <Mail className="h-4 w-4" /> {saving ? 'Création...' : 'Créer et envoyer l\'invitation'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-20 bg-white rounded-xl animate-pulse" />)}
        </div>
      ) : admins.length === 0 ? (
        <div className="text-center py-20">
          <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Aucun administrateur</p>
        </div>
      ) : (
        <div className="space-y-3">
          {admins.map(admin => (
            <Card key={admin.id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                      {admin.username[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm">{admin.username}</p>
                        {admin.mustChangePassword ? (
                          <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px] gap-1">
                            <AlertTriangle className="h-2.5 w-2.5" /> MDP temporaire
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-700 border-0 text-[10px] gap-1">
                            <CheckCircle2 className="h-2.5 w-2.5" /> Actif
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                        {admin.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {admin.email}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {admin.lastLogin ? `Dernière connexion : ${formatDate(admin.lastLogin)}` : 'Jamais connecté'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 rounded-lg text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(admin)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
