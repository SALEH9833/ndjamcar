import type { Metadata } from 'next';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ndjamcar.com';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`${API}/api/vehicles/${id}`, { next: { revalidate: 600 } });
    if (!res.ok) return { title: 'Véhicule introuvable' };
    const { data: v } = await res.json();
    const name = `${v.model.brand.name} ${v.model.name} ${v.year}`;
    const price = new Intl.NumberFormat('fr-FR').format(v.pricePerDay);
    const image = v.images?.[0]?.url;

    return {
      title: `${name} — ${price} FCFA/jour`,
      description: `Louez ${name} à N'Djaména pour ${price} FCFA/jour. ${v.transmission === 'AUTOMATIC' ? 'Automatique' : 'Manuelle'}, ${v.fuelType}, ${v.seats} places.`,
      openGraph: {
        title: `${name} — Location à N'Djaména`,
        description: `${name} à partir de ${price} FCFA/jour. Réservez en ligne.`,
        url: `${SITE_URL}/vehicules/${id}`,
        images: image ? [{ url: image, width: 800, height: 600, alt: name }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${name} — NdjamCar`,
        description: `Louez ${name} à ${price} FCFA/jour`,
        images: image ? [image] : [],
      },
    };
  } catch {
    return { title: 'Véhicule' };
  }
}

export default function VehicleDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
