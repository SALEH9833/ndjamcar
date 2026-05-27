'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Car, Menu, X, MessageCircle, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTheme } from './ThemeProvider';

const NAV_ITEMS = [
  { label: 'Accueil', href: '/' },
  { label: 'Véhicules', href: '/vehicules' },
  { label: 'Contact', href: '/contact' },
];

const WHATSAPP = '23560935774';

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { resolved, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
            <Car className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-extrabold text-gray-900 dark:text-white">Ndjam<span className="text-blue-600">Car</span></span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname === item.href ? 'bg-blue-50 dark:bg-blue-950 text-blue-700' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2.5">
          <button onClick={() => setTheme(resolved === 'dark' ? 'light' : 'dark')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            {resolved === 'dark' ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-gray-500" />}
          </button>
          <a href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Bonjour NdjamCar, je souhaite louer un véhicule.')}`} target="_blank" rel="noopener noreferrer">
            <Button className="gap-2 bg-green-600 hover:bg-green-700 rounded-xl text-sm">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </Button>
          </a>
        </div>

        <div className="flex md:hidden items-center gap-1">
          <button onClick={() => setTheme(resolved === 'dark' ? 'light' : 'dark')} className="p-2 rounded-lg">
            {resolved === 'dark' ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-gray-500" />}
          </button>
          <button className="p-2" onClick={() => setOpen(!open)}>
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 pb-4">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                'block py-3 text-sm font-medium border-b border-gray-50',
                pathname === item.href ? 'text-blue-700' : 'text-gray-600 dark:text-gray-300'
              )}
            >
              {item.label}
            </Link>
          ))}
          <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer" className="block mt-3">
            <Button className="w-full gap-2 bg-green-600 hover:bg-green-700">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </Button>
          </a>
        </div>
      )}
    </header>
  );
}
