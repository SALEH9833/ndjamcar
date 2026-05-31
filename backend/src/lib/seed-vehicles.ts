import prisma from '../prisma';

interface VehicleSeed {
  brand: string;
  model: string;
  year: number;
  color: string;
  plate: string;
  seats: number;
  transmission: 'MANUAL' | 'AUTOMATIC';
  fuel: string;
  pricePerDay: number;
  pricePerWeek?: number;
  pricePerMonth?: number;
  mileage: number;
  description: string;
  features: string;
  isFeatured: boolean;
  image: string;
}

const VEHICLES: VehicleSeed[] = [
  {
    brand: 'Toyota', model: 'Land Cruiser', year: 2023, color: 'Blanc', plate: 'A-1001-TD',
    seats: 7, transmission: 'AUTOMATIC', fuel: 'DIESEL', pricePerDay: 120000, pricePerWeek: 750000, pricePerMonth: 2800000,
    mileage: 15000, description: "Toyota Land Cruiser V8, le roi des routes tchadiennes. Climatisation puissante, 4x4 permanent, idéal pour les longs trajets et les pistes.",
    features: 'Climatisation,4x4,GPS,Bluetooth,Caméra de recul,Sièges cuir', isFeatured: true,
    image: 'https://images.unsplash.com/photo-1650530579355-7ad9d4766043?w=800&h=500&fit=crop'
  },
  {
    brand: 'Toyota', model: 'Hilux', year: 2022, color: 'Gris', plate: 'A-1002-TD',
    seats: 5, transmission: 'MANUAL', fuel: 'DIESEL', pricePerDay: 65000, pricePerWeek: 400000, pricePerMonth: 1500000,
    mileage: 35000, description: "Toyota Hilux double cabine, pick-up robuste parfait pour N'Djaména et ses environs. Résistant et fiable.",
    features: 'Climatisation,4x4,Bluetooth,Benne arrière', isFeatured: true,
    image: 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=800&h=500&fit=crop'
  },
  {
    brand: 'Toyota', model: 'Prado', year: 2023, color: 'Noir', plate: 'A-1003-TD',
    seats: 7, transmission: 'AUTOMATIC', fuel: 'DIESEL', pricePerDay: 100000, pricePerWeek: 600000, pricePerMonth: 2200000,
    mileage: 20000, description: "Toyota Prado TXL, SUV premium tout-terrain. Confort de conduite exceptionnel sur toutes les routes du Tchad.",
    features: 'Climatisation,4x4,GPS,Cuir,Toit ouvrant,Caméra de recul', isFeatured: true,
    image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&h=500&fit=crop'
  },
  {
    brand: 'Toyota', model: 'Corolla', year: 2022, color: 'Blanc', plate: 'A-1004-TD',
    seats: 5, transmission: 'AUTOMATIC', fuel: 'ESSENCE', pricePerDay: 30000, pricePerWeek: 180000, pricePerMonth: 650000,
    mileage: 28000, description: "Toyota Corolla, berline confortable et économique. Idéale pour la ville de N'Djaména.",
    features: 'Climatisation,Bluetooth,Caméra de recul,Régulateur de vitesse', isFeatured: false,
    image: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&h=500&fit=crop'
  },
  {
    brand: 'Toyota', model: 'Camry', year: 2023, color: 'Argent', plate: 'A-1005-TD',
    seats: 5, transmission: 'AUTOMATIC', fuel: 'ESSENCE', pricePerDay: 45000, pricePerWeek: 280000, pricePerMonth: 1000000,
    mileage: 12000, description: "Toyota Camry, berline haut de gamme. Confort et élégance pour vos déplacements professionnels.",
    features: 'Climatisation,Cuir,GPS,Bluetooth,Caméra de recul,Démarrage sans clé', isFeatured: true,
    image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&h=500&fit=crop'
  },
  {
    brand: 'Toyota', model: 'RAV4', year: 2022, color: 'Bleu', plate: 'A-1006-TD',
    seats: 5, transmission: 'AUTOMATIC', fuel: 'ESSENCE', pricePerDay: 50000, pricePerWeek: 300000, pricePerMonth: 1100000,
    mileage: 22000, description: "Toyota RAV4, SUV compact polyvalent. Parfait compromis entre confort urbain et capacité tout-terrain.",
    features: 'Climatisation,Bluetooth,Caméra de recul,4x4,Régulateur', isFeatured: false,
    image: 'https://images.unsplash.com/photo-1581540222194-0def2dda95b8?w=800&h=500&fit=crop'
  },
  {
    brand: 'Toyota', model: 'Fortuner', year: 2023, color: 'Blanc', plate: 'A-1007-TD',
    seats: 7, transmission: 'AUTOMATIC', fuel: 'DIESEL', pricePerDay: 80000, pricePerWeek: 500000, pricePerMonth: 1800000,
    mileage: 18000, description: "Toyota Fortuner, SUV 7 places robuste. Idéal pour les familles et les voyages longue distance au Tchad.",
    features: 'Climatisation,4x4,7 places,Bluetooth,Caméra de recul', isFeatured: true,
    image: 'https://images.unsplash.com/photo-1664783856972-ac9922d7b2d3?w=800&h=500&fit=crop'
  },
  {
    brand: 'Nissan', model: 'Patrol', year: 2022, color: 'Blanc', plate: 'A-2001-TD',
    seats: 7, transmission: 'AUTOMATIC', fuel: 'DIESEL', pricePerDay: 130000, pricePerWeek: 800000, pricePerMonth: 3000000,
    mileage: 25000, description: "Nissan Patrol V8, SUV de luxe tout-terrain. Puissance et prestige pour vos déplacements au Tchad.",
    features: 'Climatisation,4x4,Cuir,GPS,Toit ouvrant,Caméra 360°,Sièges ventilés', isFeatured: true,
    image: 'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=800&h=500&fit=crop'
  },
  {
    brand: 'Nissan', model: 'X-Trail', year: 2022, color: 'Gris', plate: 'A-2002-TD',
    seats: 5, transmission: 'AUTOMATIC', fuel: 'ESSENCE', pricePerDay: 45000, pricePerWeek: 270000, pricePerMonth: 950000,
    mileage: 30000, description: "Nissan X-Trail, SUV familial confortable. Spacieux et agréable à conduire en ville.",
    features: 'Climatisation,Bluetooth,Caméra de recul,Régulateur', isFeatured: false,
    image: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&h=500&fit=crop'
  },
  {
    brand: 'Hyundai', model: 'Tucson', year: 2023, color: 'Noir', plate: 'A-3001-TD',
    seats: 5, transmission: 'AUTOMATIC', fuel: 'ESSENCE', pricePerDay: 45000, pricePerWeek: 270000, pricePerMonth: 950000,
    mileage: 15000, description: "Hyundai Tucson nouvelle génération. Design moderne, confort premium, idéal pour la ville.",
    features: 'Climatisation,Bluetooth,Caméra de recul,Écran tactile,Démarrage sans clé', isFeatured: true,
    image: 'https://images.unsplash.com/photo-1575090536203-2a6193126514?w=800&h=500&fit=crop'
  },
  {
    brand: 'Hyundai', model: 'Santa Fe', year: 2022, color: 'Blanc', plate: 'A-3002-TD',
    seats: 7, transmission: 'AUTOMATIC', fuel: 'DIESEL', pricePerDay: 60000, pricePerWeek: 360000, pricePerMonth: 1300000,
    mileage: 20000, description: "Hyundai Santa Fe 7 places, SUV spacieux pour toute la famille. Confort et fiabilité.",
    features: 'Climatisation,7 places,Cuir,Bluetooth,Caméra de recul,4x4', isFeatured: false,
    image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&h=500&fit=crop'
  },
  {
    brand: 'Hyundai', model: 'Accent', year: 2023, color: 'Rouge', plate: 'A-3003-TD',
    seats: 5, transmission: 'AUTOMATIC', fuel: 'ESSENCE', pricePerDay: 25000, pricePerWeek: 150000, pricePerMonth: 550000,
    mileage: 10000, description: "Hyundai Accent, berline compacte économique. Parfaite pour les petits budgets en ville.",
    features: 'Climatisation,Bluetooth,USB', isFeatured: false,
    image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&h=500&fit=crop'
  },
  {
    brand: 'Mercedes-Benz', model: 'Classe E', year: 2023, color: 'Noir', plate: 'A-4001-TD',
    seats: 5, transmission: 'AUTOMATIC', fuel: 'DIESEL', pricePerDay: 150000, pricePerWeek: 900000, pricePerMonth: 3500000,
    mileage: 8000, description: "Mercedes Classe E, berline de prestige. Luxe et performance pour vos événements et déplacements VIP.",
    features: 'Climatisation,Cuir,GPS,Bluetooth,Sièges chauffants,Toit ouvrant,Caméra 360°', isFeatured: true,
    image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&h=500&fit=crop'
  },
  {
    brand: 'Mercedes-Benz', model: 'GLE', year: 2022, color: 'Blanc', plate: 'A-4002-TD',
    seats: 5, transmission: 'AUTOMATIC', fuel: 'DIESEL', pricePerDay: 170000, pricePerWeek: 1050000, pricePerMonth: 4000000,
    mileage: 12000, description: "Mercedes GLE, SUV de luxe. Confort exceptionnel et technologies de pointe.",
    features: 'Climatisation,4x4,Cuir,GPS,Caméra 360°,Sièges ventilés,Toit panoramique', isFeatured: true,
    image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=500&fit=crop'
  },
  {
    brand: 'Mitsubishi', model: 'L200', year: 2022, color: 'Argent', plate: 'A-5001-TD',
    seats: 5, transmission: 'MANUAL', fuel: 'DIESEL', pricePerDay: 55000, pricePerWeek: 330000, pricePerMonth: 1200000,
    mileage: 40000, description: "Mitsubishi L200, pick-up robuste et fiable. Parfait pour le travail et les routes difficiles du Tchad.",
    features: 'Climatisation,4x4,Bluetooth,Benne arrière', isFeatured: false,
    image: 'https://images.unsplash.com/photo-1612544448445-b8232cff3b6c?w=800&h=500&fit=crop'
  },
  {
    brand: 'Mitsubishi', model: 'Pajero', year: 2021, color: 'Noir', plate: 'A-5002-TD',
    seats: 7, transmission: 'AUTOMATIC', fuel: 'DIESEL', pricePerDay: 90000, pricePerWeek: 550000, pricePerMonth: 2000000,
    mileage: 35000, description: "Mitsubishi Pajero, légende du tout-terrain. Indestructible sur les pistes tchadiennes.",
    features: 'Climatisation,4x4,7 places,Cuir,Bluetooth', isFeatured: false,
    image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&h=500&fit=crop'
  },
  {
    brand: 'Suzuki', model: 'Jimny', year: 2023, color: 'Vert', plate: 'A-6001-TD',
    seats: 4, transmission: 'MANUAL', fuel: 'ESSENCE', pricePerDay: 35000, pricePerWeek: 210000, pricePerMonth: 750000,
    mileage: 8000, description: "Suzuki Jimny, petit 4x4 agile et fun. Parfait pour se faufiler dans les rues de N'Djaména.",
    features: 'Climatisation,4x4,Bluetooth', isFeatured: true,
    image: 'https://images.unsplash.com/photo-1730830812275-05d20a099679?w=800&h=500&fit=crop'
  },
  {
    brand: 'Suzuki', model: 'Vitara', year: 2022, color: 'Blanc', plate: 'A-6002-TD',
    seats: 5, transmission: 'AUTOMATIC', fuel: 'ESSENCE', pricePerDay: 40000, pricePerWeek: 240000, pricePerMonth: 850000,
    mileage: 18000, description: "Suzuki Vitara, SUV compact et économique. Bon rapport qualité-prix.",
    features: 'Climatisation,Bluetooth,Caméra de recul,4x4', isFeatured: false,
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=500&fit=crop'
  },
  {
    brand: 'Kia', model: 'Sportage', year: 2023, color: 'Gris', plate: 'A-7001-TD',
    seats: 5, transmission: 'AUTOMATIC', fuel: 'DIESEL', pricePerDay: 50000, pricePerWeek: 300000, pricePerMonth: 1100000,
    mileage: 12000, description: "Kia Sportage, SUV moderne au design audacieux. Technologie et confort au rendez-vous.",
    features: 'Climatisation,Écran tactile,Caméra de recul,Bluetooth,Démarrage sans clé', isFeatured: false,
    image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&h=500&fit=crop'
  },
  {
    brand: 'Ford', model: 'Ranger', year: 2022, color: 'Bleu', plate: 'A-8001-TD',
    seats: 5, transmission: 'AUTOMATIC', fuel: 'DIESEL', pricePerDay: 60000, pricePerWeek: 360000, pricePerMonth: 1300000,
    mileage: 25000, description: "Ford Ranger, pick-up puissant et confortable. Double cabine spacieuse, idéal pour le Tchad.",
    features: 'Climatisation,4x4,Bluetooth,Benne arrière,Caméra de recul', isFeatured: false,
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&h=500&fit=crop'
  },
  {
    brand: 'Lexus', model: 'LX', year: 2023, color: 'Noir', plate: 'A-9001-TD',
    seats: 7, transmission: 'AUTOMATIC', fuel: 'DIESEL', pricePerDay: 200000, pricePerWeek: 1200000, pricePerMonth: 4500000,
    mileage: 5000, description: "Lexus LX 600, le summum du luxe tout-terrain. Véhicule de prestige pour les occasions spéciales.",
    features: 'Climatisation,4x4,Cuir,GPS,Caméra 360°,Sièges massants,Écran arrière,Toit ouvrant', isFeatured: true,
    image: 'https://images.unsplash.com/photo-1568844293986-8c3a55dae4a0?w=800&h=500&fit=crop'
  },
  {
    brand: 'BMW', model: 'X5', year: 2022, color: 'Blanc', plate: 'A-1010-TD',
    seats: 5, transmission: 'AUTOMATIC', fuel: 'DIESEL', pricePerDay: 160000, pricePerWeek: 950000, pricePerMonth: 3600000,
    mileage: 10000, description: "BMW X5, SUV sportif de luxe. Performance et élégance pour se démarquer.",
    features: 'Climatisation,4x4,Cuir,GPS,Toit panoramique,Caméra 360°,Harman Kardon', isFeatured: false,
    image: 'https://images.unsplash.com/photo-1556189250-72ba954cfc2b?w=800&h=500&fit=crop'
  },
  {
    brand: 'Renault', model: 'Duster', year: 2023, color: 'Marron', plate: 'A-1011-TD',
    seats: 5, transmission: 'MANUAL', fuel: 'DIESEL', pricePerDay: 30000, pricePerWeek: 180000, pricePerMonth: 650000,
    mileage: 15000, description: "Renault Duster, SUV abordable et robuste. Excellent choix pour les routes du Tchad à petit budget.",
    features: 'Climatisation,4x4,Bluetooth,GPS', isFeatured: false,
    image: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&h=500&fit=crop'
  },
  {
    brand: 'Peugeot', model: '3008', year: 2022, color: 'Gris', plate: 'A-1012-TD',
    seats: 5, transmission: 'AUTOMATIC', fuel: 'DIESEL', pricePerDay: 55000, pricePerWeek: 330000, pricePerMonth: 1200000,
    mileage: 20000, description: "Peugeot 3008, SUV français au design futuriste. Intérieur i-Cockpit unique et confortable.",
    features: 'Climatisation,Écran tactile,Caméra de recul,Bluetooth,i-Cockpit', isFeatured: false,
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=500&fit=crop'
  },
];

async function fixBrokenImages(): Promise<void> {
  const plates = VEHICLES.map(v => v.plate);
  const vehicles = await prisma.vehicle.findMany({
    where: { plateNumber: { in: plates } },
    include: { images: true },
  });
  for (const vehicle of vehicles) {
    const seed = VEHICLES.find(v => v.plate === vehicle.plateNumber);
    if (!seed) continue;
    for (const img of vehicle.images) {
      if (img.url !== seed.image) {
        await prisma.vehicleImage.update({ where: { id: img.id }, data: { url: seed.image } });
      }
    }
  }
  if (vehicles.length > 0) console.log(`[Bootstrap] Images mises à jour pour ${vehicles.length} véhicules`);
}

export async function seedVehicles(): Promise<void> {
  try {
    const count = await prisma.vehicle.count();
    if (count > 0) {
      await fixBrokenImages();
      return;
    }

    for (const v of VEHICLES) {
      const brand = await prisma.brand.findFirst({ where: { name: v.brand } });
      if (!brand) continue;
      const model = await prisma.model.findFirst({ where: { name: v.model, brandId: brand.id } });
      if (!model) continue;

      const vehicle = await prisma.vehicle.create({
        data: {
          modelId: model.id,
          year: v.year,
          color: v.color,
          plateNumber: v.plate,
          seats: v.seats,
          transmission: v.transmission,
          fuelType: v.fuel,
          pricePerDay: v.pricePerDay,
          pricePerWeek: v.pricePerWeek || null,
          pricePerMonth: v.pricePerMonth || null,
          mileage: v.mileage,
          description: v.description,
          features: v.features,
          status: 'AVAILABLE',
          isFeatured: v.isFeatured,
        },
      });

      await prisma.vehicleImage.create({
        data: {
          vehicleId: vehicle.id,
          url: v.image,
          isPrimary: true,
          order: 0,
        },
      });
    }

    console.log(`[Bootstrap] ${VEHICLES.length} véhicules avec photos créés`);
  } catch (err) {
    console.error('[Bootstrap] Seed vehicles failed:', err);
  }
}
