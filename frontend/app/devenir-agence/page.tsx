'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, CheckCircle2, Phone, Mail, MapPin, Car, FileText, ArrowRight, Shield, TrendingUp, Users, UserPlus } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function DevenirAgencePage() {
  const [form, setForm] = useState({
    name: '',
    ownerName: '',
    phone: '',
    whatsapp: '',
    email: '',
    city: '',
    address: '',
    vehicleCount: 0,
    adminCount: 1,
    adminNames: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/agency-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          vehicleCount: parseInt(form.vehicleCount.toString()) || 0,
          adminCount: parseInt(form.adminCount.toString()) || 1,
          adminNames: form.adminNames || null,
          whatsapp: form.whatsapp || form.phone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Demande envoyée !</h1>
          <p className="text-gray-600 mb-2">
            Votre demande de création d&apos;agence a été soumise avec succès.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Notre équipe vous contactera via WhatsApp pour finaliser votre inscription et le paiement.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/">
              <Button variant="outline" className="rounded-xl">Retour à l&apos;accueil</Button>
            </Link>
            <a href="https://wa.me/23560935774" target="_blank" rel="noopener noreferrer">
              <Button className="rounded-xl bg-green-600 hover:bg-green-700 gap-2">
                <Phone className="h-4 w-4" /> WhatsApp
              </Button>
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center mx-auto mb-6">
              <Building2 className="h-8 w-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Devenir une agence partenaire</h1>
            <p className="text-blue-100 text-lg max-w-2xl mx-auto">
              Rejoignez NdjamCar et développez votre activité de location de véhicules avec notre plateforme
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {[
            { icon: TrendingUp, title: 'Visibilité', desc: 'Vos véhicules visibles par tous les clients' },
            { icon: Shield, title: 'Gestion complète', desc: 'Tableau de bord dédié pour votre agence' },
            { icon: Users, title: 'Support', desc: 'Accompagnement et suivi personnalisé' },
          ].map((item, i) => (
            <motion.div key={i} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 * i }}>
              <Card className="border-0 shadow-md">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <item.icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{item.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="max-w-2xl mx-auto pb-16">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-xl font-bold mb-1">Formulaire d&apos;inscription</h2>
              <p className="text-sm text-gray-500 mb-6">Remplissez vos informations, nous vous contacterons rapidement</p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1.5 block">Nom de l&apos;agence *</label>
                    <Input
                      required
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="Ex: AutoLoc Tchad"
                      className="rounded-lg h-11"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1.5 block">Nom du propriétaire *</label>
                    <Input
                      required
                      value={form.ownerName}
                      onChange={e => setForm({ ...form, ownerName: e.target.value })}
                      placeholder="Votre nom complet"
                      className="rounded-lg h-11"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1.5 block flex items-center gap-1">
                      <Phone className="h-3 w-3" /> Téléphone *
                    </label>
                    <Input
                      required
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      placeholder="+235 XX XX XX XX"
                      className="rounded-lg h-11"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1.5 block">WhatsApp</label>
                    <Input
                      value={form.whatsapp}
                      onChange={e => setForm({ ...form, whatsapp: e.target.value })}
                      placeholder="Si différent du téléphone"
                      className="rounded-lg h-11"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1.5 block flex items-center gap-1">
                      <Mail className="h-3 w-3" /> Email
                    </label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="contact@votre-agence.com"
                      className="rounded-lg h-11"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1.5 block flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Ville
                    </label>
                    <Input
                      value={form.city}
                      onChange={e => setForm({ ...form, city: e.target.value })}
                      placeholder="N'Djamena"
                      className="rounded-lg h-11"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block">Adresse</label>
                  <Input
                    value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                    placeholder="Quartier, rue, repère..."
                    className="rounded-lg h-11"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1.5 block flex items-center gap-1">
                      <Car className="h-3 w-3" /> Nombre de véhicules
                    </label>
                    <Input
                      type="number"
                      min={0}
                      value={form.vehicleCount}
                      onChange={e => setForm({ ...form, vehicleCount: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                      className="rounded-lg h-11"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1.5 block flex items-center gap-1">
                      <Users className="h-3 w-3" /> Nombre d&apos;administrateurs *
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      required
                      value={form.adminCount}
                      onChange={e => setForm({ ...form, adminCount: parseInt(e.target.value) || 1 })}
                      placeholder="1"
                      className="rounded-lg h-11"
                    />
                  </div>
                </div>

                {form.adminCount > 1 && (
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1.5 block flex items-center gap-1">
                      <Users className="h-3 w-3" /> Noms des administrateurs
                    </label>
                    <textarea
                      value={form.adminNames}
                      onChange={e => setForm({ ...form, adminNames: e.target.value })}
                      placeholder={`Listez les ${form.adminCount} administrateurs (un par ligne):\nAdmin 1 - Nom complet\nAdmin 2 - Nom complet`}
                      rows={Math.min(form.adminCount + 1, 6)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Chaque admin aura son propre compte de connexion</p>
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block flex items-center gap-1">
                    <FileText className="h-3 w-3" /> Description / Message
                  </label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Décrivez votre activité, vos attentes..."
                    rows={4}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">Comment ça marche ?</h4>
                  <ol className="text-xs text-blue-800 space-y-1.5">
                    <li className="flex items-start gap-2"><span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0">1</span> Vous remplissez ce formulaire</li>
                    <li className="flex items-start gap-2"><span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0">2</span> Notre équipe vous contacte via WhatsApp</li>
                    <li className="flex items-start gap-2"><span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0">3</span> Vous finalisez le paiement en espèces</li>
                    <li className="flex items-start gap-2"><span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0">4</span> Vous recevez vos identifiants de connexion</li>
                  </ol>
                </div>

                <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl text-base font-semibold gap-2">
                  {loading ? (
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <>Envoyer ma demande <ArrowRight className="h-4 w-4" /></>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
