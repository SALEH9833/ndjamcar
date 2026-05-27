import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nos véhicules — Location de voitures',
  description: 'Découvrez notre flotte de véhicules à louer à N\'Djaména. SUV, berlines, pick-up — tous les budgets. Réservez en ligne.',
  openGraph: {
    title: 'Nos véhicules — NdjamCar',
    description: 'Découvrez notre flotte de véhicules à louer à N\'Djaména. Réservez en ligne ou via WhatsApp.',
  },
};

export default function VehiculesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
