import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import LayoutShell from '@/components/LayoutShell';
import { Toaster } from 'sonner';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ndjamcar.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'NdjamCar — Location de voitures à N\'Djaména, Tchad',
    template: '%s | NdjamCar',
  },
  description: 'Louez la voiture idéale à N\'Djaména. Large choix de véhicules, prix compétitifs, service fiable. Réservation en ligne ou via WhatsApp.',
  keywords: ['location voiture', 'N\'Djaména', 'Tchad', 'louer véhicule', 'NdjamCar', 'rental car Chad'],
  authors: [{ name: 'NdjamCar' }],
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'NdjamCar',
    title: 'NdjamCar — Location de voitures à N\'Djaména',
    description: 'Louez la voiture idéale à N\'Djaména. Large choix, prix compétitifs, réservation facile.',
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NdjamCar — Location de voitures à N\'Djaména',
    description: 'Louez la voiture idéale à N\'Djaména. Large choix, prix compétitifs, réservation facile.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${geistSans.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('ndjamcar_theme');if(t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')}catch(e){}})()` }} />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="NdjamCar" />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <LayoutShell>{children}</LayoutShell>
        <Toaster position="bottom-right" richColors />
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js')})}`,
          }}
        />
      </body>
    </html>
  );
}
