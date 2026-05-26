import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import LayoutShell from '@/components/LayoutShell';
import { Toaster } from 'sonner';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NdjamCar - Location de voitures à N\'Djamena',
  description: 'Louez la voiture idéale à N\'Djamena. Large choix de véhicules, prix compétitifs, service fiable.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <LayoutShell>{children}</LayoutShell>
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
