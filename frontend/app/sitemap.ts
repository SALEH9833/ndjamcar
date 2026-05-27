import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ndjamcar.com';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/vehicules`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ];

  let vehiclePages: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API}/api/vehicles`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const json = await res.json();
      vehiclePages = (json.data || []).map((v: { id: number; updatedAt: string }) => ({
        url: `${SITE_URL}/vehicules/${v.id}`,
        lastModified: new Date(v.updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
    }
  } catch {}

  return [...staticPages, ...vehiclePages];
}
