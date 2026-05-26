import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const brands = [
    { name: 'Toyota', order: 1 },
    { name: 'Hyundai', order: 2 },
    { name: 'Nissan', order: 3 },
    { name: 'Mercedes-Benz', order: 4 },
    { name: 'Suzuki', order: 5 },
    { name: 'Mitsubishi', order: 6 },
    { name: 'Land Rover', order: 7 },
    { name: 'Renault', order: 8 },
  ];

  for (const b of brands) {
    await prisma.brand.upsert({ where: { name: b.name }, update: { order: b.order }, create: b });
  }

  const toyota = await prisma.brand.findUnique({ where: { name: 'Toyota' } });
  const hyundai = await prisma.brand.findUnique({ where: { name: 'Hyundai' } });
  const nissan = await prisma.brand.findUnique({ where: { name: 'Nissan' } });
  const mercedes = await prisma.brand.findUnique({ where: { name: 'Mercedes-Benz' } });
  const suzuki = await prisma.brand.findUnique({ where: { name: 'Suzuki' } });
  const mitsubishi = await prisma.brand.findUnique({ where: { name: 'Mitsubishi' } });
  const landrover = await prisma.brand.findUnique({ where: { name: 'Land Rover' } });

  const models = [
    { name: 'Corolla', brandId: toyota!.id },
    { name: 'Hilux', brandId: toyota!.id },
    { name: 'Land Cruiser', brandId: toyota!.id },
    { name: 'RAV4', brandId: toyota!.id },
    { name: 'Camry', brandId: toyota!.id },
    { name: 'Tucson', brandId: hyundai!.id },
    { name: 'Santa Fe', brandId: hyundai!.id },
    { name: 'Accent', brandId: hyundai!.id },
    { name: 'Patrol', brandId: nissan!.id },
    { name: 'X-Trail', brandId: nissan!.id },
    { name: 'Classe C', brandId: mercedes!.id },
    { name: 'Classe E', brandId: mercedes!.id },
    { name: 'Jimny', brandId: suzuki!.id },
    { name: 'Vitara', brandId: suzuki!.id },
    { name: 'Pajero', brandId: mitsubishi!.id },
    { name: 'L200', brandId: mitsubishi!.id },
    { name: 'Defender', brandId: landrover!.id },
  ];

  for (const m of models) {
    await prisma.model.upsert({
      where: { brandId_name: { brandId: m.brandId, name: m.name } },
      update: {},
      create: m,
    });
  }

  const contentItems = [
    { key: 'hero_title', value: 'Location de voitures à N\'Djamena', group: 'hero', label: 'Titre principal', type: 'text' },
    { key: 'hero_subtitle', value: 'Trouvez la voiture idéale pour vos déplacements. Large choix, prix compétitifs, service fiable.', group: 'hero', label: 'Sous-titre', type: 'textarea' },
    { key: 'hero_image', value: '', group: 'hero', label: 'Image hero', type: 'image' },
    { key: 'whatsapp_number', value: '23560935774', group: 'contact', label: 'Numéro WhatsApp', type: 'text' },
    { key: 'phone', value: '+235 60 93 57 74', group: 'contact', label: 'Téléphone', type: 'text' },
    { key: 'email', value: 'contact@ndjamcar.com', group: 'contact', label: 'Email', type: 'text' },
    { key: 'address', value: 'N\'Djamena, Tchad', group: 'contact', label: 'Adresse', type: 'text' },
    { key: 'about_title', value: 'NdjamCar - Votre partenaire mobilité', group: 'about', label: 'Titre', type: 'text' },
    { key: 'about_description', value: 'NdjamCar est votre service de location de voitures de confiance à N\'Djamena. Nous proposons une large gamme de véhicules pour tous vos besoins.', group: 'about', label: 'Description', type: 'textarea' },
    { key: 'footer_name', value: 'NdjamCar', group: 'footer', label: 'Nom', type: 'text' },
    { key: 'footer_description', value: 'Service de location de voitures à N\'Djamena, Tchad.', group: 'footer', label: 'Description', type: 'textarea' },
    { key: 'footer_copyright', value: '© 2026 NdjamCar. Tous droits réservés.', group: 'footer', label: 'Copyright', type: 'text' },
  ];

  for (const item of contentItems) {
    await prisma.siteContent.upsert({
      where: { key: item.key },
      update: {},
      create: item,
    });
  }

  console.log('Seed completed: brands, models, content');
}

main().catch(console.error).finally(() => prisma.$disconnect());
