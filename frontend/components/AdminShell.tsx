'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Car, LayoutDashboard, CarFront, CalendarCheck, MapPin, MessageSquare, FileText, LogOut, Menu, X, ChevronRight, UserCog, Building2, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

interface AdminData {
  username: string;
  role: string;
  agencyId: number | null;
  agency?: { name: string } | null;
}

const SUPER_ADMIN_NAV = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Agences', href: '/admin/agences', icon: Building2 },
  { label: 'Demandes', href: '/admin/demandes', icon: ClipboardList },
  { label: 'Contenu', href: '/admin/contenu', icon: FileText },
  { label: 'Mon profil', href: '/admin/profil', icon: UserCog },
];

const AGENCY_NAV = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Véhicules', href: '/admin/vehicules', icon: CarFront },
  { label: 'Réservations', href: '/admin/reservations', icon: CalendarCheck },
  { label: 'Suivi GPS', href: '/admin/tracking', icon: MapPin },
  { label: 'Messages', href: '/admin/messages', icon: MessageSquare },
  { label: 'Mon profil', href: '/admin/profil', icon: UserCog },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [admin, setAdmin] = useState<AdminData | null>(null);
  const [pendingRequests, setPendingRequests] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('ndjamcar_token');
    if (!token) { router.replace('/admin/login'); return; }
    api.get('/api/auth/me').then(r => {
      const data = r.data.data;
      setAdmin(data);
      localStorage.setItem('ndjamcar_role', data.role);
      if (data.agencyId) localStorage.setItem('ndjamcar_agencyId', data.agencyId.toString());
      if (data.role === 'SUPER_ADMIN') {
        api.get('/api/agency-requests/count').then(c => setPendingRequests(c.data.data || 0)).catch(() => {});
      }
    }).catch(() => {
      localStorage.removeItem('ndjamcar_token');
      localStorage.removeItem('ndjamcar_role');
      localStorage.removeItem('ndjamcar_agencyId');
      router.replace('/admin/login');
    });
  }, [router]);

  const logout = () => {
    localStorage.removeItem('ndjamcar_token');
    localStorage.removeItem('ndjamcar_role');
    localStorage.removeItem('ndjamcar_agencyId');
    router.replace('/admin/login');
  };

  if (!admin) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  );

  const isSuperAdmin = admin.role === 'SUPER_ADMIN';
  const NAV = isSuperAdmin ? SUPER_ADMIN_NAV : AGENCY_NAV;
  const isActive = (href: string) => href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
  const roleLabel = isSuperAdmin ? 'Super Admin' : admin.agency?.name || 'Agence';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transform transition-transform duration-200 lg:translate-x-0 lg:static lg:inset-auto',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-center justify-between h-16 px-5 border-b border-gray-800">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', isSuperAdmin ? 'bg-amber-500' : 'bg-blue-600')}>
              <Car className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg">{isSuperAdmin ? 'NdjamCar' : admin.agency?.name || 'NdjamCar'}</span>
          </Link>
          <button className="lg:hidden p-1" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <nav className="p-3 space-y-1 flex-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive(item.href)
                  ? isSuperAdmin ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              )}
            >
              <item.icon className="h-4.5 w-4.5 shrink-0" />
              {item.label}
              {item.href === '/admin/demandes' && pendingRequests > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pendingRequests}</span>
              )}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-800">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
              isSuperAdmin ? 'bg-amber-500' : 'bg-blue-600'
            )}>
              {admin.username[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{admin.username}</p>
              <p className="text-xs text-gray-500">{roleLabel}</p>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-gray-800 w-full transition-colors">
            <LogOut className="h-4.5 w-4.5" />
            Déconnexion
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 h-14 flex items-center px-4 gap-4">
          <button className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <Link href="/admin" className="hover:text-gray-900">Admin</Link>
            {pathname !== '/admin' && (
              <>
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="text-gray-900 font-medium">
                  {NAV.find(n => isActive(n.href))?.label || ''}
                </span>
              </>
            )}
          </div>
          <div className="ml-auto flex items-center gap-3">
            {isSuperAdmin && (
              <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">SUPER ADMIN</span>
            )}
            <Link href="/" target="_blank" className="text-xs text-blue-600 hover:underline">
              Voir le site →
            </Link>
          </div>
        </header>
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
