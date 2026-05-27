import PDFDocument from 'pdfkit';
import type { Readable } from 'stream';

interface InvoiceData {
  id: number;
  clientName: string;
  clientPhone: string;
  clientEmail: string | null;
  vehicleName: string;
  plateNumber: string;
  startDate: Date;
  endDate: Date;
  days: number;
  pricePerDay: number;
  totalPrice: number;
  paidAmount: number;
  status: string;
  createdAt: Date;
}

const STATUS_FR: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  ACTIVE: 'En cours',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
  EXPIRED: 'Expirée',
};

function formatDateFR(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatPrice(n: number): string {
  return n.toLocaleString('fr-FR') + ' FCFA';
}

export function generateInvoicePDF(data: InvoiceData): InstanceType<typeof PDFDocument> {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  const blue = '#2563eb';
  const dark = '#111827';
  const gray = '#6b7280';
  const lightBg = '#f3f4f6';

  doc.rect(0, 0, 595, 100).fill(blue);
  doc.fontSize(26).fill('#ffffff').text('NdjamCar', 50, 30, { continued: false });
  doc.fontSize(10).fill('#dbeafe').text('Location de véhicules — N\'Djaména, Tchad', 50, 62);

  const invoiceNum = `FAC-${String(data.id).padStart(5, '0')}`;
  doc.fontSize(10).fill('#dbeafe').text(invoiceNum, 400, 35, { align: 'right', width: 145 });
  doc.text(formatDateFR(data.createdAt), 400, 50, { align: 'right', width: 145 });

  let y = 120;

  doc.fontSize(18).fill(dark).text('Facture / Reçu', 50, y);
  y += 35;

  doc.roundedRect(50, y, 240, 90, 6).fill(lightBg);
  doc.fontSize(9).fill(gray).text('CLIENT', 65, y + 12);
  doc.fontSize(12).fill(dark).text(data.clientName, 65, y + 28);
  doc.fontSize(10).fill(gray).text(data.clientPhone, 65, y + 46);
  if (data.clientEmail) doc.text(data.clientEmail, 65, y + 61);

  doc.roundedRect(305, y, 240, 90, 6).fill(lightBg);
  doc.fontSize(9).fill(gray).text('RÉSERVATION', 320, y + 12);
  doc.fontSize(10).fill(dark).text(`N° ${invoiceNum}`, 320, y + 28);
  doc.fill(gray).text(`Statut : ${STATUS_FR[data.status] || data.status}`, 320, y + 46);
  doc.text(`Créée le ${formatDateFR(data.createdAt)}`, 320, y + 61);

  y += 110;

  const colX = [50, 280, 380, 480];
  const colW = [230, 100, 100, 65];

  doc.rect(50, y, 495, 28).fill(blue);
  doc.fontSize(9).fill('#ffffff');
  doc.text('DESCRIPTION', colX[0] + 10, y + 9, { width: colW[0] });
  doc.text('PÉRIODE', colX[1] + 5, y + 9, { width: colW[1] });
  doc.text('PRIX/JOUR', colX[2] + 5, y + 9, { width: colW[2] });
  doc.text('TOTAL', colX[3] + 5, y + 9, { width: colW[3] });
  y += 28;

  doc.rect(50, y, 495, 50).fill('#fafafa').stroke('#e5e7eb');
  doc.fontSize(11).fill(dark).text(data.vehicleName, colX[0] + 10, y + 8, { width: colW[0] });
  doc.fontSize(9).fill(gray).text(`Immat. : ${data.plateNumber}`, colX[0] + 10, y + 26, { width: colW[0] });
  doc.fontSize(10).fill(dark);
  doc.text(`${data.days} jour(s)`, colX[1] + 5, y + 14, { width: colW[1] });
  doc.text(formatPrice(data.pricePerDay), colX[2] + 5, y + 14, { width: colW[2] });
  doc.text(formatPrice(data.totalPrice), colX[3] + 5, y + 14, { width: colW[3] });
  y += 50;

  y += 10;
  doc.rect(50, y, 495, 1).fill('#e5e7eb');
  y += 15;

  const rightX = 380;
  doc.fontSize(10).fill(gray).text('Sous-total :', rightX, y, { width: 80 });
  doc.fill(dark).text(formatPrice(data.totalPrice), rightX + 85, y, { width: 80 });
  y += 22;
  doc.fill(gray).text('Payé :', rightX, y, { width: 80 });
  doc.fill('#16a34a').text(formatPrice(data.paidAmount), rightX + 85, y, { width: 80 });
  y += 22;
  const rest = data.totalPrice - data.paidAmount;
  doc.rect(rightX - 10, y - 4, 185, 28).fill(rest > 0 ? '#fef2f2' : '#f0fdf4');
  doc.fontSize(11).fill(rest > 0 ? '#dc2626' : '#16a34a').text('Reste à payer :', rightX, y + 2, { width: 80 });
  doc.text(formatPrice(rest), rightX + 85, y + 2, { width: 80 });

  y += 50;

  doc.roundedRect(50, y, 495, 60, 6).fill(lightBg);
  doc.fontSize(9).fill(gray).text('DATES DE LOCATION', 65, y + 10);
  doc.fontSize(11).fill(dark).text(`Du ${formatDateFR(data.startDate)}  au  ${formatDateFR(data.endDate)}`, 65, y + 28);
  doc.fontSize(9).fill(gray).text(`Durée : ${data.days} jour(s)`, 65, y + 45);

  const footerY = 750;
  doc.rect(0, footerY, 595, 50).fill(lightBg);
  doc.fontSize(8).fill(gray).text('NdjamCar — Location de véhicules — N\'Djaména, Tchad', 50, footerY + 12, { align: 'center', width: 495 });
  doc.text('Tél : +235 60 93 57 74 — Ce document fait office de reçu de réservation', 50, footerY + 24, { align: 'center', width: 495 });

  doc.end();
  return doc;
}
