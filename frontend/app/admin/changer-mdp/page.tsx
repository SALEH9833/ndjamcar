'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Car, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function ForceChangePasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) { toast.error('Le mot de passe doit avoir au moins 6 caractères'); return; }
    if (newPassword !== confirmPassword) { toast.error('Les mots de passe ne correspondent pas'); return; }
    setLoading(true);
    try {
      await api.put('/api/auth/force-password', { newPassword });
      toast.success('Mot de passe modifié avec succès');
      router.replace('/admin');
    } catch {
      toast.error('Erreur lors du changement de mot de passe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4">
            <Car className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">NdjamCar</h1>
          <p className="text-gray-400 text-sm mt-1">Changement de mot de passe</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-2">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-300 text-sm font-semibold">Mot de passe temporaire</p>
              <p className="text-amber-200/70 text-xs mt-1 leading-relaxed">
                Votre mot de passe actuel est temporaire. Veuillez le changer pour sécuriser votre compte.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm text-gray-300">Nouveau mot de passe</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                type={showPw ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 caractères"
                className="h-11 bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 rounded-lg pl-10 pr-10"
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm text-gray-300">Confirmer le mot de passe</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Retapez le mot de passe"
                className="h-11 bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 rounded-lg pl-10"
              />
            </div>
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-400">Les mots de passe ne correspondent pas</p>
            )}
            {newPassword && confirmPassword && newPassword === confirmPassword && (
              <p className="text-xs text-green-400">Les mots de passe correspondent ✓</p>
            )}
          </div>

          <Button type="submit" disabled={loading} className="w-full h-11 bg-blue-600 hover:bg-blue-700 rounded-xl text-base">
            {loading ? 'Modification...' : 'Changer mon mot de passe'}
          </Button>
        </form>
      </div>
    </div>
  );
}
