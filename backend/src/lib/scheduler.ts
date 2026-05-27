import prisma from '../prisma';

const ONE_HOUR_MS = 60 * 60 * 1000;

async function rejectExpiredReservations(): Promise<number> {
  const cutoff = new Date(Date.now() - ONE_HOUR_MS);

  const expired = await prisma.reservation.findMany({
    where: { status: 'PENDING', createdAt: { lt: cutoff } },
    select: { id: true, vehicleId: true },
  });

  if (expired.length === 0) return 0;

  await prisma.reservation.updateMany({
    where: { id: { in: expired.map(r => r.id) } },
    data: { status: 'EXPIRED' },
  });

  return expired.length;
}

export function startScheduler(): void {
  console.log('⏰ [Scheduler] Auto-rejet des réservations PENDING > 1h activé (vérification chaque minute)');

  setInterval(async () => {
    try {
      const count = await rejectExpiredReservations();
      if (count > 0) {
        console.log(`⏰ [Scheduler] ${count} réservation(s) expirée(s) rejetée(s) automatiquement`);
      }
    } catch (err) {
      console.error('⏰ [Scheduler] Erreur:', err);
    }
  }, 60 * 1000);

  rejectExpiredReservations().then(count => {
    if (count > 0) console.log(`⏰ [Scheduler] ${count} réservation(s) en retard nettoyée(s) au démarrage`);
  }).catch(() => {});
}
