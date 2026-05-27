import prisma from '../prisma';

const TRACCAR_URL = process.env.TRACCAR_URL || 'http://localhost:8082';
const TRACCAR_USER = process.env.TRACCAR_USER || 'admin';
const TRACCAR_PASSWORD = process.env.TRACCAR_PASSWORD || 'admin';

const authHeader = 'Basic ' + Buffer.from(`${TRACCAR_USER}:${TRACCAR_PASSWORD}`).toString('base64');

interface TraccarDevice {
  id: number;
  name: string;
  uniqueId: string;
  status: string;
  lastUpdate: string | null;
}

interface TraccarPosition {
  id: number;
  deviceId: number;
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  fixTime: string;
}

async function traccarFetch<T>(endpoint: string): Promise<T | null> {
  try {
    const res = await fetch(`${TRACCAR_URL}/api${endpoint}`, {
      headers: { 'Authorization': authHeader, 'Accept': 'application/json' },
    });
    if (!res.ok) return null;
    return await res.json() as T;
  } catch {
    return null;
  }
}

async function syncPositions(): Promise<number> {
  const trackings = await prisma.vehicleTracking.findMany({
    where: { imei: { not: null } },
    select: { id: true, vehicleId: true, imei: true },
  });

  if (trackings.length === 0) return 0;

  const devices = await traccarFetch<TraccarDevice[]>('/devices');
  if (!devices || devices.length === 0) return 0;

  const positions = await traccarFetch<TraccarPosition[]>('/positions');
  if (!positions || positions.length === 0) return 0;

  const deviceMap = new Map<string, TraccarDevice>();
  devices.forEach(d => deviceMap.set(d.uniqueId, d));

  const positionMap = new Map<number, TraccarPosition>();
  positions.forEach(p => positionMap.set(p.deviceId, p));

  let updated = 0;

  for (const tracking of trackings) {
    if (!tracking.imei) continue;
    const device = deviceMap.get(tracking.imei);
    if (!device) continue;

    const position = positionMap.get(device.id);
    if (!position) continue;

    const isOnline = device.status === 'online';
    const speedKmh = Math.round(position.speed * 1.852);

    await prisma.vehicleTracking.update({
      where: { id: tracking.id },
      data: {
        latitude: position.latitude,
        longitude: position.longitude,
        speed: speedKmh,
        heading: position.course,
        isOnline,
        lastUpdate: new Date(position.fixTime),
        deviceId: String(device.id),
      },
    });

    updated++;
  }

  return updated;
}

let syncInterval: ReturnType<typeof setInterval> | null = null;

export function startTraccarSync(): void {
  if (!process.env.TRACCAR_URL) {
    console.log('📡 [Traccar] TRACCAR_URL non configuré — synchronisation désactivée');
    return;
  }

  console.log(`📡 [Traccar] Synchronisation activée (${TRACCAR_URL}) — toutes les 15s`);

  syncPositions().then(count => {
    if (count > 0) console.log(`📡 [Traccar] ${count} position(s) synchronisée(s) au démarrage`);
  }).catch(() => {});

  syncInterval = setInterval(async () => {
    try {
      const count = await syncPositions();
      if (count > 0) {
        console.log(`📡 [Traccar] ${count} position(s) synchronisée(s)`);
      }
    } catch (err) {
      console.error('📡 [Traccar] Erreur sync:', err);
    }
  }, 15000);
}

export function stopTraccarSync(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

export async function getTraccarDevices(): Promise<TraccarDevice[]> {
  const devices = await traccarFetch<TraccarDevice[]>('/devices');
  return devices || [];
}
