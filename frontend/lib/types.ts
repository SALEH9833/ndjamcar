export interface Agency {
  id: number;
  name: string;
  slug: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  logoUrl: string | null;
  whatsapp: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: { vehicles: number; admins: number; reservations: number };
}

export interface Brand {
  id: number;
  name: string;
  logoUrl: string | null;
  order: number;
  models: Model[];
}

export interface Model {
  id: number;
  name: string;
  brandId: number;
  brand?: { id: number; name: string; logoUrl?: string | null };
}

export interface VehicleImage {
  id: number;
  url: string;
  altText: string | null;
  isPrimary: boolean;
  order: number;
}

export interface Vehicle {
  id: number;
  agencyId: number;
  agency?: { id: number; name: string; slug?: string; phone?: string; whatsapp?: string; city?: string };
  modelId: number;
  model: Model & { brand: { id: number; name: string; logoUrl?: string | null } };
  year: number;
  color: string | null;
  plateNumber: string;
  seats: number;
  transmission: string;
  fuelType: string;
  pricePerDay: number;
  pricePerWeek: number | null;
  pricePerMonth: number | null;
  description: string | null;
  features: string | null;
  status: string;
  mileage: number | null;
  isFeatured: boolean;
  images: VehicleImage[];
  createdAt: string;
}

export interface Reservation {
  id: number;
  agencyId: number;
  vehicleId: number;
  vehicle?: Vehicle;
  clientName: string;
  clientPhone: string;
  clientEmail: string | null;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: string;
  notes: string | null;
  paidAmount: number;
  createdAt: string;
}

export interface VehicleTracking {
  id: number;
  vehicleId: number;
  vehicle?: {
    id: number;
    plateNumber: string;
    status: string;
    color: string | null;
    model: { name: string; brand: { name: string } };
  };
  latitude: number | null;
  longitude: number | null;
  speed: number | null;
  heading: number | null;
  lastUpdate: string | null;
  deviceId: string | null;
  isOnline: boolean;
}

export interface ContactMessage {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string | null;
  role: string;
  agencyId: number | null;
  agency?: Agency | null;
}
