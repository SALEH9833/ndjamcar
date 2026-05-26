'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { CarFront, CalendarCheck, MessageSquare, DollarSign, TrendingUp, AlertCircle, MapPin } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import api from '@/lib/api';

interface Stats {
  totalVehicles: number;
  availableVehicles: number;
  rentedVehicles: number;
  totalReservations: number;
  pendingReservations: number;
  activeReservations: number;
  totalRevenue: number;
  unreadMessages: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    Promise.all([
      api.get('/api/vehicles/stats').then(r => r.data.data).catch(() => null),
      api.get('/api/reservations').then(r => r.data).catch(() => null),
      api.get('/api/contact').then(r => r.data).catch(() => null),
    ]).then(([vehicleStats, reservations, messages]) => {
      const resData = reservations?.data || [];
      const msgData = messages?.data || [];
      setStats({
        totalVehicles: vehicleStats?.total || 0,
        availableVehicles: vehicleStats?.available || 0,
        rentedVehicles: vehicleStats?.rented || 0,
        totalReservations: resData.length,
        pendingReservations: resData.filter((r: { status: string }) => r.status === 'PENDING').length,
        activeReservations: resData.filter((r: { status: string }) => r.status === 'ACTIVE').length,
        totalRevenue: resData
          .filter((r: { status: string }) => ['COMPLETED', 'ACTIVE'].includes(r.status))
          .reduce((sum: number, r: { paidAmount: number }) => sum + r.paidAmount, 0),
        unreadMessages: msgData.filter((m: { isRead: boolean }) => !m.isRead).length,
      });
    });
  }, []);

  if (!stats) return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-28 bg-white rounded-xl animate-pulse" />
      ))}
    </div>
  );

  const cards = [
    { label: 'Total véhicules', value: stats.totalVehicles, icon: CarFront, color: 'blue', href: '/admin/vehicules' },
    { label: 'Disponibles', value: stats.availableVehicles, icon: CarFront, color: 'green', href: '/admin/vehicules' },
    { label: 'En location', value: stats.rentedVehicles, icon: MapPin, color: 'orange', href: '/admin/tracking' },
    { label: 'Réservations', value: stats.totalReservations, icon: CalendarCheck, color: 'purple', href: '/admin/reservations' },
    { label: 'En attente', value: stats.pendingReservations, icon: AlertCircle, color: 'amber', href: '/admin/reservations' },
    { label: 'Actives', value: stats.activeReservations, icon: TrendingUp, color: 'teal', href: '/admin/reservations' },
    { label: 'Revenus', value: formatPrice(stats.totalRevenue), icon: DollarSign, color: 'emerald', href: '/admin/reservations' },
    { label: 'Messages non lus', value: stats.unreadMessages, icon: MessageSquare, color: 'red', href: '/admin/messages' },
  ];

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
    teal: 'bg-teal-50 text-teal-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500 text-sm">Vue d&apos;ensemble de votre activité</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Link key={card.label} href={card.href}>
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[card.color]}`}>
                    <card.icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
