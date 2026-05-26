'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Lock, Mail, Eye, EyeOff, Save, Shield } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function AdminProfilPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    api.get('/api/auth/me').then(r => {
      setUsername(r.data.data.username || '');
      setEmail(r.data.data.email || '');
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) { toast.error('Le nom d\'utilisateur est requis'); return; }
    setSavingInfo(true);
    try {
      await api.put('/api/auth/profile', { username, email });
      toast.success('Profil mis à jour');
    } catch { toast.error('Erreur lors de la mise à jour'); }
    finally { setSavingInfo(false); }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) { toast.error('Remplissez les champs'); return; }
    if (newPassword.length < 6) { toast.error('Le mot de passe doit avoir au moins 6 caractères'); return; }
    if (newPassword !== confirmPassword) { toast.error('Les mots de passe ne correspondent pas'); return; }
    setSavingPw(true);
    try {
      await api.put('/api/auth/password', { currentPassword, newPassword });
      toast.success('Mot de passe modifié');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Erreur');
    }
    finally { setSavingPw(false); }
  };

  if (loading) return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="h-48 bg-white rounded-xl animate-pulse" />
      <div className="h-64 bg-white rounded-xl animate-pulse" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Mon profil</h1>
        <p className="text-gray-500 text-sm">Gérez vos informations personnelles</p>
      </div>

      <div className="space-y-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="font-bold">Informations générales</h2>
                <p className="text-xs text-gray-400">Modifiez votre nom et email</p>
              </div>
            </div>
            <form onSubmit={handleUpdateInfo} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Nom d&apos;utilisateur</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input value={username} onChange={(e) => setUsername(e.target.value)} className="h-10 pl-10 rounded-lg" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-10 pl-10 rounded-lg" />
                </div>
              </div>
              <Button type="submit" disabled={savingInfo} className="gap-2 bg-blue-600 hover:bg-blue-700 rounded-xl">
                <Save className="h-4 w-4" /> {savingInfo ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Shield className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h2 className="font-bold">Sécurité</h2>
                <p className="text-xs text-gray-400">Changez votre mot de passe</p>
              </div>
            </div>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Mot de passe actuel</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type={showCurrentPw ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="h-10 pl-10 pr-10 rounded-lg"
                  />
                  <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Nouveau mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type={showNewPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-10 pl-10 pr-10 rounded-lg"
                  />
                  <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Confirmer le nouveau mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-10 pl-10 rounded-lg"
                  />
                </div>
                {newPassword && confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500">Les mots de passe ne correspondent pas</p>
                )}
                {newPassword && confirmPassword && newPassword === confirmPassword && (
                  <p className="text-xs text-green-500">Les mots de passe correspondent</p>
                )}
              </div>
              <Button type="submit" disabled={savingPw} className="gap-2 bg-amber-600 hover:bg-amber-700 rounded-xl">
                <Lock className="h-4 w-4" /> {savingPw ? 'Modification...' : 'Changer le mot de passe'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
