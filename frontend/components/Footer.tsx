'use client';

import Link from 'next/link';
import { Car, Phone, Mail, MapPin, MessageCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-white mt-auto border-t dark:border-gray-800">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
                <Car className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-extrabold">Ndjam<span className="text-blue-400">Car</span></span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Service de location de voitures de confiance à N&apos;Djamena, Tchad. Large gamme de véhicules pour tous vos besoins.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Navigation</h3>
            <div className="space-y-2">
              <Link href="/" className="block text-sm text-gray-400 hover:text-white transition-colors">Accueil</Link>
              <Link href="/vehicules" className="block text-sm text-gray-400 hover:text-white transition-colors">Véhicules</Link>
              <Link href="/contact" className="block text-sm text-gray-400 hover:text-white transition-colors">Contact</Link>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Contact</h3>
            <div className="space-y-3">
              <a href="tel:+23560935774" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                <Phone className="h-4 w-4" /> +235 60 93 57 74
              </a>
              <a href="mailto:contact@ndjamcar.com" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                <Mail className="h-4 w-4" /> contact@ndjamcar.com
              </a>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <MapPin className="h-4 w-4" /> N&apos;Djamena, Tchad
              </div>
              <a href="https://wa.me/23560935774" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300 transition-colors">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6 text-center">
          <p className="text-xs text-gray-500">&copy; 2026 NdjamCar. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
