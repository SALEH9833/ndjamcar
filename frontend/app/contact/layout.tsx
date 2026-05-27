import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contactez NdjamCar pour toute question sur la location de véhicules à N\'Djaména. Téléphone, WhatsApp ou formulaire en ligne.',
  openGraph: {
    title: 'Contactez-nous — NdjamCar',
    description: 'Contactez NdjamCar pour vos besoins en location de véhicules à N\'Djaména.',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
