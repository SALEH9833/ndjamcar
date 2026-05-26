'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Car, ArrowLeft, MessageCircle, Fuel, Users, Settings2, Gauge, ChevronLeft, ChevronRight, Phone, Send, CheckCircle } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { Vehicle } from '@/lib/types';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const WHATSAPP = '23560935774';

export default function VehicleDetailPage() {
  const { id } = useParams();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/vehicles/${id}`)
      .then(r => r.json())
      .then(d => setVehicle(d.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="container mx-auto px-4 py-12">
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="h-96 bg-gray-200 rounded-2xl" />
        <div className="h-6 bg-gray-200 rounded w-64" />
      </div>
    </div>
  );

  if (!vehicle) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <Car className="h-16 w-16 text-gray-300 mx-auto mb-4" />
      <p className="text-xl font-medium text-gray-500">Véhicule introuvable</p>
      <Link href="/vehicules"><Button variant="outline" className="mt-4 gap-2"><ArrowLeft className="h-4 w-4" /> Retour</Button></Link>
    </div>
  );

  const images = vehicle.images.length > 0 ? vehicle.images : [];
  const fullName = `${vehicle.model.brand.name} ${vehicle.model.name} ${vehicle.year}`;
  const features = vehicle.features ? vehicle.features.split(',').map(f => f.trim()) : [];

  const days = startDate && endDate ? Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000)) : 0;
  const total = days * vehicle.pricePerDay;

  const handleReservation = async () => {
    if (!name || !phone || !startDate || !endDate) {
      toast.error('Remplissez votre nom, téléphone et les dates');
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      toast.error('La date de fin doit être après la date de début');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/api/reservations', {
        vehicleId: vehicle.id,
        clientName: name,
        clientPhone: phone,
        clientEmail: email || null,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        totalPrice: total,
        notes: null,
      });
      setSubmitted(true);
      toast.success('Réservation envoyée !');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || 'Erreur lors de la réservation');
    } finally {
      setSubmitting(false);
    }
  };

  const buildWhatsApp = () => {
    const lines = [
      `Bonjour NdjamCar,`,
      ``,
      `Je souhaite réserver le véhicule *${fullName}* (${vehicle.plateNumber}).`,
      ``,
      `Prix : ${formatPrice(vehicle.pricePerDay)}/jour`,
    ];
    if (days > 0) lines.push(`Durée : ${days} jour(s) — Total estimé : ${formatPrice(total)}`);
    if (startDate) lines.push(`Du : ${new Date(startDate).toLocaleDateString('fr-FR')}`);
    if (endDate) lines.push(`Au : ${new Date(endDate).toLocaleDateString('fr-FR')}`);
    if (name) lines.push(`Nom : ${name}`);
    if (phone) lines.push(`Tél : ${phone}`);
    lines.push(``, `Merci de confirmer la disponibilité.`);
    return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(lines.join('\n'))}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <Link href="/vehicules" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6">
          <ArrowLeft className="h-4 w-4" /> Retour aux véhicules
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="relative rounded-2xl overflow-hidden bg-gray-100" style={{ height: '400px' }}>
              {images.length > 0 ? (
                <>
                  <Image src={images[currentImage].url} alt={fullName} fill className="object-cover" />
                  {images.length > 1 && (
                    <>
                      <button onClick={() => setCurrentImage(i => i > 0 ? i - 1 : images.length - 1)} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:bg-white">
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button onClick={() => setCurrentImage(i => i < images.length - 1 ? i + 1 : 0)} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:bg-white">
                        <ChevronRight className="h-5 w-5" />
                      </button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {images.map((_, i) => (
                          <button key={i} onClick={() => setCurrentImage(i)} className={`w-2.5 h-2.5 rounded-full transition-colors ${i === currentImage ? 'bg-white' : 'bg-white/50'}`} />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Car className="h-24 w-24 text-gray-300" /></div>
              )}
              <Badge className={`absolute top-4 left-4 border-0 ${vehicle.status === 'AVAILABLE' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                {vehicle.status === 'AVAILABLE' ? 'Disponible' : 'Loué'}
              </Badge>
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <button key={img.id} onClick={() => setCurrentImage(i)} className={`relative w-20 h-16 rounded-lg overflow-hidden shrink-0 border-2 ${i === currentImage ? 'border-blue-500' : 'border-transparent'}`}>
                    <Image src={img.url} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div>
              <p className="text-sm text-blue-600 font-semibold">{vehicle.model.brand.name}</p>
              <h1 className="text-3xl font-bold">{vehicle.model.name} {vehicle.year}</h1>
              {vehicle.color && <p className="text-gray-500 mt-1">Couleur : {vehicle.color}</p>}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Settings2, label: 'Transmission', value: vehicle.transmission === 'AUTOMATIC' ? 'Automatique' : 'Manuelle' },
                { icon: Fuel, label: 'Carburant', value: vehicle.fuelType },
                { icon: Users, label: 'Places', value: `${vehicle.seats} places` },
                { icon: Gauge, label: 'Kilométrage', value: vehicle.mileage ? `${vehicle.mileage.toLocaleString('fr-FR')} km` : 'N/A' },
              ].map((item) => (
                <Card key={item.label} className="border-0 shadow-sm">
                  <CardContent className="p-4 text-center">
                    <item.icon className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">{item.label}</p>
                    <p className="font-semibold text-sm">{item.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {vehicle.description && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <h2 className="font-bold text-lg mb-3">Description</h2>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">{vehicle.description}</p>
                </CardContent>
              </Card>
            )}

            {features.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <h2 className="font-bold text-lg mb-3">Équipements</h2>
                  <div className="flex flex-wrap gap-2">
                    {features.map((f) => <Badge key={f} variant="secondary" className="text-sm">{f}</Badge>)}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="border-0 shadow-lg sticky top-24">
              <CardContent className="p-6">
                {submitted ? (
                  <div className="text-center py-4">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">Réservation envoyée !</h3>
                    <p className="text-sm text-gray-500 mb-4">Nous vous contacterons pour confirmer.</p>
                    <a href={buildWhatsApp()} target="_blank" rel="noopener noreferrer" className="block mb-3">
                      <Button className="w-full h-11 bg-green-600 hover:bg-green-700 rounded-xl gap-2">
                        <MessageCircle className="h-4 w-4" /> Contacter via WhatsApp
                      </Button>
                    </a>
                    <Button variant="outline" onClick={() => { setSubmitted(false); setName(''); setPhone(''); setEmail(''); setStartDate(''); setEndDate(''); }} className="w-full rounded-xl">
                      Nouvelle réservation
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="text-center mb-6">
                      <p className="text-3xl font-extrabold text-blue-600">{formatPrice(vehicle.pricePerDay)}</p>
                      <p className="text-sm text-gray-400">par jour</p>
                      {vehicle.pricePerWeek && <p className="text-sm text-gray-500 mt-1">{formatPrice(vehicle.pricePerWeek)} /semaine</p>}
                      {vehicle.pricePerMonth && <p className="text-sm text-gray-500">{formatPrice(vehicle.pricePerMonth)} /mois</p>}
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Votre nom *</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Votre nom complet" className="h-10 rounded-lg" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Téléphone *</Label>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                          <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+235 XX XX XX XX" className="h-10 rounded-lg" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Email</Label>
                        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.com" className="h-10 rounded-lg" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Du *</Label>
                          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-10 rounded-lg" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Au *</Label>
                          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-10 rounded-lg" />
                        </div>
                      </div>

                      {days > 0 && (
                        <div className="bg-blue-50 rounded-xl p-4 text-center">
                          <p className="text-sm text-gray-600">{days} jour(s)</p>
                          <p className="text-2xl font-bold text-blue-600">{formatPrice(total)}</p>
                          <p className="text-xs text-gray-400">Estimation — paiement en cash</p>
                        </div>
                      )}

                      <Button
                        onClick={handleReservation}
                        disabled={submitting || vehicle.status !== 'AVAILABLE'}
                        className="w-full h-12 bg-blue-600 hover:bg-blue-700 rounded-xl text-base font-semibold gap-2"
                      >
                        <Send className="h-4 w-4" /> {submitting ? 'Envoi...' : 'Réserver maintenant'}
                      </Button>

                      <div className="relative flex items-center gap-3 my-1">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-xs text-gray-400">ou</span>
                        <div className="flex-1 h-px bg-gray-200" />
                      </div>

                      <a href={buildWhatsApp()} target="_blank" rel="noopener noreferrer" className="block">
                        <Button type="button" className="w-full h-11 bg-green-600 hover:bg-green-700 rounded-xl text-base gap-2">
                          <MessageCircle className="h-5 w-5" /> Réserver via WhatsApp
                        </Button>
                      </a>

                      <p className="text-xs text-center text-gray-400">
                        Paiement en cash uniquement. Un membre de l&apos;équipe vous contactera pour confirmer.
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
