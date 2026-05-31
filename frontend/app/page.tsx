'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, Shield, Clock, Star, ArrowRight, MessageCircle, Fuel, Users, Settings2, ChevronDown, Phone, MapPin, Sparkles } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import type { Vehicle, Brand } from '@/lib/types';
import { useSiteContent } from '@/lib/useSiteContent';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 2000;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target]);

  return <span ref={ref}>{count}{suffix}</span>;
}

export default function HomePage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const { get } = useSiteContent();
  const WHATSAPP = get('whatsapp', '23560935774');

  useEffect(() => {
    fetch(`${API}/api/vehicles?featured=true`).then(r => r.json()).then(d => setVehicles((d.data || []).slice(0, 6))).catch(() => {});
    fetch(`${API}/api/brands`).then(r => r.json()).then(d => setBrands(d.data || [])).catch(() => {});
  }, []);

  const scrollToVehicles = () => {
    document.getElementById('featured-vehicles')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div>
      <section className="relative min-h-[650px] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1600&h=800&fit=crop"
            alt="Location voiture"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/95 via-gray-900/80 to-gray-900/40" />
        </div>
        <div className="container mx-auto px-4 relative z-10 py-20">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-2xl">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
              <Badge className="bg-blue-600/20 text-blue-300 border-blue-500/30 mb-6 text-sm px-4 py-1.5">
                <MapPin className="h-3.5 w-3.5 mr-1.5" />N&apos;Djamena, Tchad
              </Badge>
            </motion.div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
              Louez votre <span className="text-blue-400">voiture</span> en toute simplicité
            </h1>
            <p className="text-lg text-gray-300 mb-8 leading-relaxed max-w-lg">
              Large choix de véhicules pour tous vos besoins. Réservez en quelques clics et contactez-nous directement via WhatsApp.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/vehicules">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 rounded-xl text-base gap-2 h-12 px-8">
                  Voir les véhicules <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <a href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Bonjour NdjamCar, je souhaite louer un véhicule.')}`} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="bg-green-600 hover:bg-green-700 rounded-xl text-base gap-2 h-12 px-8 text-white">
                  <MessageCircle className="h-5 w-5" /> WhatsApp
                </Button>
              </a>
            </div>
          </motion.div>
        </div>

        <motion.button
          onClick={scrollToVehicles}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 hover:text-white transition-colors"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <ChevronDown className="h-8 w-8" />
        </motion.button>
      </section>

      <section className="py-12 px-4 bg-white dark:bg-gray-950">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: 50, suffix: '+', label: 'Véhicules' },
              { value: 500, suffix: '+', label: 'Clients satisfaits' },
              { value: 8, suffix: '', label: 'Marques disponibles' },
              { value: 24, suffix: '/7', label: 'Service client' },
            ].map((stat) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <p className="text-3xl md:text-4xl font-extrabold text-blue-600">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <Badge className="bg-blue-100 text-blue-700 border-0 mb-3"><Sparkles className="h-3 w-3 mr-1" />Pourquoi nous choisir</Badge>
            <h2 className="text-3xl font-bold">Un service de qualité</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: 'Fiable & Sécurisé', desc: 'Véhicules entretenus, assurance incluse, paiement en cash' },
              { icon: Clock, title: 'Disponibilité immédiate', desc: 'Réservez et récupérez votre véhicule rapidement' },
              { icon: Star, title: 'Meilleurs prix', desc: 'Tarifs compétitifs à la journée, semaine ou au mois' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                whileHover={{ y: -6, scale: 1.02 }}
              >
                <Card className="border-0 shadow-lg text-center h-full hover:shadow-xl transition-shadow">
                  <CardContent className="p-8">
                    <motion.div
                      className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-5"
                      whileHover={{ rotate: 5 }}
                    >
                      <item.icon className="h-8 w-8 text-blue-600" />
                    </motion.div>
                    <h3 className="font-bold text-xl mb-2">{item.title}</h3>
                    <p className="text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {brands.length > 0 && (
        <section className="py-12 px-4">
          <div className="container mx-auto">
            <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-2xl font-bold text-center mb-8">
              Nos marques
            </motion.h2>
            <div className="flex flex-wrap justify-center gap-4">
              {brands.map((b, i) => (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link href={`/vehicules?brand=${b.id}`}>
                    <div className="px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all cursor-pointer shadow-sm hover:shadow-md">
                      <span className="font-semibold text-gray-700 dark:text-gray-200">{b.name}</span>
                      <span className="text-xs text-gray-400 ml-2">({b.models.length})</span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {vehicles.length > 0 && (
        <section id="featured-vehicles" className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-10">
              <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <h2 className="text-3xl font-bold">Véhicules en vedette</h2>
                <p className="text-muted-foreground mt-1">Notre sélection pour vous</p>
              </motion.div>
              <Link href="/vehicules">
                <Button variant="outline" className="gap-2 rounded-xl">Voir tout <ArrowRight className="h-4 w-4" /></Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map((v, i) => (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <VehicleCard vehicle={v} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-16 px-4">
        <div className="container mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">Comment ça marche ?</h2>
            <p className="text-muted-foreground">En 3 étapes simples</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '1', title: 'Choisissez', desc: 'Parcourez notre catalogue et trouvez le véhicule parfait', color: 'bg-blue-600' },
              { step: '2', title: 'Réservez', desc: 'Remplissez le formulaire ou contactez-nous via WhatsApp', color: 'bg-green-600' },
              { step: '3', title: 'Roulez', desc: 'Récupérez votre véhicule et profitez de votre trajet', color: 'bg-purple-600' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="text-center"
              >
                <motion.div
                  className={`w-14 h-14 ${item.color} text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-4`}
                  whileHover={{ rotate: 10, scale: 1.1 }}
                >
                  {item.step}
                </motion.div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-white rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Besoin d&apos;un véhicule ?</h2>
            <p className="text-blue-100 text-lg mb-8 max-w-lg mx-auto">Contactez-nous directement sur WhatsApp pour une réponse rapide et un service personnalisé.</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Bonjour NdjamCar, je souhaite louer un véhicule.')}`} target="_blank" rel="noopener noreferrer">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white rounded-xl text-base gap-2 h-12 px-10 font-bold">
                    <MessageCircle className="h-5 w-5" /> WhatsApp
                  </Button>
                </motion.div>
              </a>
              <a href="tel:+23560935774">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="lg" className="bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-xl text-base gap-2 h-12 px-10 font-bold">
                    <Phone className="h-5 w-5" /> Appeler
                  </Button>
                </motion.div>
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

function VehicleCard({ vehicle: v }: { vehicle: Vehicle }) {
  const primaryImage = v.images.find(i => i.isPrimary) || v.images[0];
  return (
    <Link href={`/vehicules/${v.id}`}>
      <motion.div whileHover={{ y: -6 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
        <Card className="border-0 shadow-lg overflow-hidden group cursor-pointer h-full">
          <div className="relative h-52 bg-gray-100">
            {primaryImage ? (
              <Image src={primaryImage.url} alt={`${v.model.brand.name} ${v.model.name}`} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><Car className="h-16 w-16 text-gray-300" /></div>
            )}
            <Badge className={`absolute top-3 left-3 border-0 text-xs ${v.status === 'AVAILABLE' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
              {v.status === 'AVAILABLE' ? 'Disponible' : 'Loué'}
            </Badge>
            {v.isFeatured && <Badge className="absolute top-3 right-3 bg-amber-500 text-white border-0 text-xs">Vedette</Badge>}
          </div>
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-xs text-blue-600 font-semibold">{v.model.brand.name}</p>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">{v.model.name} {v.year}</h3>
              </div>
              <div className="text-right">
                <p className="text-xl font-extrabold text-blue-600">{formatPrice(v.pricePerDay)}</p>
                <p className="text-xs text-gray-400">/jour</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
              <span className="flex items-center gap-1"><Settings2 className="h-3.5 w-3.5" />{v.transmission === 'AUTOMATIC' ? 'Auto' : 'Manuel'}</span>
              <span className="flex items-center gap-1"><Fuel className="h-3.5 w-3.5" />{v.fuelType}</span>
              <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{v.seats} places</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}
