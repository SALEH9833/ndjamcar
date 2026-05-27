import nodemailer from 'nodemailer';

const transporter = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

const FROM = process.env.SMTP_FROM || 'NdjamCar <noreply@ndjamcar.com>';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

export async function sendWelcomeEmail(to: string, username: string, tempPassword: string): Promise<boolean> {
  const loginUrl = `${FRONTEND_URL}/admin/login`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 50px; height: 50px; background: #2563eb; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center;">
          <span style="color: white; font-size: 24px; font-weight: bold;">N</span>
        </div>
        <h1 style="color: #111827; font-size: 22px; margin-top: 15px;">Bienvenue sur NdjamCar</h1>
      </div>

      <p style="color: #374151; font-size: 15px; line-height: 1.6;">
        Bonjour <strong>${username}</strong>,
      </p>
      <p style="color: #374151; font-size: 15px; line-height: 1.6;">
        Votre compte administrateur a été créé. Voici vos identifiants de connexion :
      </p>

      <div style="background: #f3f4f6; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Identifiants</p>
        <p style="margin: 0 0 6px; font-size: 15px;"><strong>Utilisateur :</strong> ${username}</p>
        <p style="margin: 0; font-size: 15px;"><strong>Mot de passe :</strong> <code style="background: #e5e7eb; padding: 2px 8px; border-radius: 4px; font-size: 14px;">${tempPassword}</code></p>
      </div>

      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 600;">⚠️ Mot de passe temporaire</p>
        <p style="margin: 5px 0 0; color: #92400e; font-size: 13px;">
          Ce mot de passe est temporaire. Vous serez invité à le changer lors de votre première connexion.
        </p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${loginUrl}" style="display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 12px 30px; border-radius: 10px; font-weight: 600; font-size: 15px;">
          Se connecter
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">
        NdjamCar — Location de véhicules
      </p>
    </div>
  `;

  if (!transporter) {
    console.log('\n📧 [Email] SMTP non configuré — email affiché en console :');
    console.log(`   To: ${to}`);
    console.log(`   Username: ${username}`);
    console.log(`   Temp Password: ${tempPassword}`);
    console.log(`   Login URL: ${loginUrl}\n`);
    return true;
  }

  try {
    await transporter.sendMail({
      from: FROM,
      to,
      subject: 'NdjamCar — Vos identifiants de connexion',
      html,
    });
    console.log(`📧 [Email] Envoyé à ${to}`);
    return true;
  } catch (err) {
    console.error('📧 [Email] Erreur:', err);
    return false;
  }
}

interface ReservationNotif {
  clientName: string;
  clientPhone: string;
  clientEmail: string | null;
  vehicleName: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  days: number;
}

export async function sendReservationNotifEmail(r: ReservationNotif): Promise<boolean> {
  const admins = await (await import('../prisma')).default.adminUser.findMany({
    where: { email: { not: null } },
    select: { email: true },
  });

  const emails = admins.map(a => a.email).filter(Boolean) as string[];
  if (emails.length === 0) return false;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px 20px;">
      <div style="text-align: center; margin-bottom: 25px;">
        <div style="width: 50px; height: 50px; background: #2563eb; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center;">
          <span style="color: white; font-size: 24px; font-weight: bold;">N</span>
        </div>
        <h1 style="color: #111827; font-size: 20px; margin-top: 12px;">Nouvelle réservation</h1>
      </div>

      <div style="background: #eff6ff; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <p style="margin: 0 0 8px; color: #1e40af; font-size: 16px; font-weight: 700;">${r.vehicleName}</p>
        <p style="margin: 0; color: #3b82f6; font-size: 14px;">${r.startDate} → ${r.endDate} (${r.days} jour${r.days > 1 ? 's' : ''})</p>
      </div>

      <div style="background: #f3f4f6; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <p style="margin: 0 0 6px; font-size: 14px;"><strong>Client :</strong> ${r.clientName}</p>
        <p style="margin: 0 0 6px; font-size: 14px;"><strong>Téléphone :</strong> ${r.clientPhone}</p>
        ${r.clientEmail ? `<p style="margin: 0 0 6px; font-size: 14px;"><strong>Email :</strong> ${r.clientEmail}</p>` : ''}
        <p style="margin: 0; font-size: 14px;"><strong>Total :</strong> <span style="color: #2563eb; font-weight: 700;">${r.totalPrice.toLocaleString('fr-FR')} FCFA</span></p>
      </div>

      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 12px 15px; margin-bottom: 20px;">
        <p style="margin: 0; color: #92400e; font-size: 13px;">
          ⏰ Cette réservation sera automatiquement annulée si elle n'est pas confirmée dans l'heure.
        </p>
      </div>

      <div style="text-align: center; margin: 25px 0;">
        <a href="${FRONTEND_URL}/admin/reservations" style="display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 12px 30px; border-radius: 10px; font-weight: 600; font-size: 15px;">
          Voir les réservations
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;" />
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">NdjamCar — Location de véhicules</p>
    </div>
  `;

  if (!transporter) {
    console.log(`\n📧 [Notif] Nouvelle réservation: ${r.clientName} — ${r.vehicleName}`);
    return true;
  }

  try {
    await transporter.sendMail({
      from: FROM,
      to: emails.join(', '),
      subject: `NdjamCar — Nouvelle réservation : ${r.clientName}`,
      html,
    });
    console.log(`📧 [Notif] Email envoyé à ${emails.length} admin(s)`);
    return true;
  } catch (err) {
    console.error('📧 [Notif] Erreur:', err);
    return false;
  }
}

export function buildWhatsAppReservationUrl(r: ReservationNotif): string {
  const whatsapp = process.env.WHATSAPP_NUMBER || '23560935774';
  const msg = `🚗 *Nouvelle réservation NdjamCar*\n\n` +
    `*Véhicule :* ${r.vehicleName}\n` +
    `*Client :* ${r.clientName}\n` +
    `*Tél :* ${r.clientPhone}\n` +
    `*Dates :* ${r.startDate} → ${r.endDate} (${r.days}j)\n` +
    `*Total :* ${r.totalPrice.toLocaleString('fr-FR')} FCFA\n\n` +
    `⏰ Confirmez dans l'heure sinon elle sera annulée.`;
  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`;
}
