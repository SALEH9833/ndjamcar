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
    { name: 'BMW', order: 9 },
    { name: 'Peugeot', order: 10 },
    { name: 'Kia', order: 11 },
    { name: 'Honda', order: 12 },
    { name: 'Ford', order: 13 },
    { name: 'Volkswagen', order: 14 },
    { name: 'Lexus', order: 15 },
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
  const renault = await prisma.brand.findUnique({ where: { name: 'Renault' } });
  const bmw = await prisma.brand.findUnique({ where: { name: 'BMW' } });
  const peugeot = await prisma.brand.findUnique({ where: { name: 'Peugeot' } });
  const kia = await prisma.brand.findUnique({ where: { name: 'Kia' } });
  const honda = await prisma.brand.findUnique({ where: { name: 'Honda' } });
  const ford = await prisma.brand.findUnique({ where: { name: 'Ford' } });
  const volkswagen = await prisma.brand.findUnique({ where: { name: 'Volkswagen' } });
  const lexus = await prisma.brand.findUnique({ where: { name: 'Lexus' } });

  const models = [
    { name: 'Corolla', brandId: toyota!.id },
    { name: 'Hilux', brandId: toyota!.id },
    { name: 'Land Cruiser', brandId: toyota!.id },
    { name: 'RAV4', brandId: toyota!.id },
    { name: 'Camry', brandId: toyota!.id },
    { name: 'Prado', brandId: toyota!.id },
    { name: 'Fortuner', brandId: toyota!.id },
    { name: 'Yaris', brandId: toyota!.id },
    { name: 'Rush', brandId: toyota!.id },
    { name: 'Avanza', brandId: toyota!.id },

    { name: 'Tucson', brandId: hyundai!.id },
    { name: 'Santa Fe', brandId: hyundai!.id },
    { name: 'Accent', brandId: hyundai!.id },
    { name: 'Creta', brandId: hyundai!.id },
    { name: 'Elantra', brandId: hyundai!.id },
    { name: 'Sonata', brandId: hyundai!.id },
    { name: 'i10', brandId: hyundai!.id },
    { name: 'i20', brandId: hyundai!.id },

    { name: 'Patrol', brandId: nissan!.id },
    { name: 'X-Trail', brandId: nissan!.id },
    { name: 'Navara', brandId: nissan!.id },
    { name: 'Sentra', brandId: nissan!.id },
    { name: 'Sunny', brandId: nissan!.id },
    { name: 'Kicks', brandId: nissan!.id },
    { name: 'Pathfinder', brandId: nissan!.id },

    { name: 'Classe C', brandId: mercedes!.id },
    { name: 'Classe E', brandId: mercedes!.id },
    { name: 'Classe S', brandId: mercedes!.id },
    { name: 'GLE', brandId: mercedes!.id },
    { name: 'GLC', brandId: mercedes!.id },
    { name: 'Classe A', brandId: mercedes!.id },
    { name: 'Sprinter', brandId: mercedes!.id },

    { name: 'Jimny', brandId: suzuki!.id },
    { name: 'Vitara', brandId: suzuki!.id },
    { name: 'Swift', brandId: suzuki!.id },
    { name: 'Alto', brandId: suzuki!.id },
    { name: 'Dzire', brandId: suzuki!.id },

    { name: 'Pajero', brandId: mitsubishi!.id },
    { name: 'L200', brandId: mitsubishi!.id },
    { name: 'Outlander', brandId: mitsubishi!.id },
    { name: 'ASX', brandId: mitsubishi!.id },
    { name: 'Eclipse Cross', brandId: mitsubishi!.id },

    { name: 'Defender', brandId: landrover!.id },
    { name: 'Discovery', brandId: landrover!.id },
    { name: 'Range Rover', brandId: landrover!.id },
    { name: 'Range Rover Sport', brandId: landrover!.id },
    { name: 'Evoque', brandId: landrover!.id },

    { name: 'Duster', brandId: renault!.id },
    { name: 'Clio', brandId: renault!.id },
    { name: 'Logan', brandId: renault!.id },
    { name: 'Sandero', brandId: renault!.id },
    { name: 'Kadjar', brandId: renault!.id },
    { name: 'Koleos', brandId: renault!.id },

    { name: 'X3', brandId: bmw!.id },
    { name: 'X5', brandId: bmw!.id },
    { name: 'Série 3', brandId: bmw!.id },
    { name: 'Série 5', brandId: bmw!.id },
    { name: 'Série 7', brandId: bmw!.id },
    { name: 'X1', brandId: bmw!.id },

    { name: '208', brandId: peugeot!.id },
    { name: '308', brandId: peugeot!.id },
    { name: '3008', brandId: peugeot!.id },
    { name: '5008', brandId: peugeot!.id },
    { name: '508', brandId: peugeot!.id },
    { name: 'Partner', brandId: peugeot!.id },

    { name: 'Sportage', brandId: kia!.id },
    { name: 'Sorento', brandId: kia!.id },
    { name: 'Picanto', brandId: kia!.id },
    { name: 'Rio', brandId: kia!.id },
    { name: 'Seltos', brandId: kia!.id },
    { name: 'Carnival', brandId: kia!.id },

    { name: 'Civic', brandId: honda!.id },
    { name: 'CR-V', brandId: honda!.id },
    { name: 'HR-V', brandId: honda!.id },
    { name: 'Accord', brandId: honda!.id },
    { name: 'City', brandId: honda!.id },

    { name: 'Ranger', brandId: ford!.id },
    { name: 'Everest', brandId: ford!.id },
    { name: 'Focus', brandId: ford!.id },
    { name: 'EcoSport', brandId: ford!.id },
    { name: 'Explorer', brandId: ford!.id },

    { name: 'Golf', brandId: volkswagen!.id },
    { name: 'Tiguan', brandId: volkswagen!.id },
    { name: 'Polo', brandId: volkswagen!.id },
    { name: 'Passat', brandId: volkswagen!.id },
    { name: 'Touareg', brandId: volkswagen!.id },
    { name: 'Amarok', brandId: volkswagen!.id },

    { name: 'RX', brandId: lexus!.id },
    { name: 'LX', brandId: lexus!.id },
    { name: 'NX', brandId: lexus!.id },
    { name: 'ES', brandId: lexus!.id },
    { name: 'GX', brandId: lexus!.id },
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

  console.log('Seed completed: 15 brands, 90+ models, 12 content items');
}

main().catch(console.error).finally(() => prisma.$disconnect());
