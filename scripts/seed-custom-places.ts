import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Adding specific places to Armenia...");
  
  const cityArmenia = await prisma.city.findFirst({
    where: { name: "Armenia", countryCode: "CO" }
  });
  if (!cityArmenia) throw new Error("Armenia not found");

  const admin = await prisma.user.findFirst({ where: { email: "admin@ubica2.com" } });
  
  const barType = await prisma.placeType.findFirst({ where: { code: "BAR" } });
  const restType = await prisma.placeType.findFirst({ where: { code: "RESTAURANT" } });
  const parkType = await prisma.placeType.findFirst({ where: { code: "PARK" } });

  const places = [
    // Bares
    { name: "La Estación GastroPub", type: barType!.id, lat: 4.5420, lng: -75.6600, desc: "GastroPub" },
    { name: "Antro Urbano Armenia", type: barType!.id, lat: 4.5430, lng: -75.6610, desc: "Bar urbano" },
    { name: "Zoco Bar", type: barType!.id, lat: 4.5440, lng: -75.6620, desc: "Bar" },
    { name: "London Bar Armenia", type: barType!.id, lat: 4.5450, lng: -75.6630, desc: "Pub inglés" },
    { name: "Route 66 Bar", type: barType!.id, lat: 4.5460, lng: -75.6640, desc: "Bar rock" },
    
    // Restaurantes
    { name: "Rancho Eden", type: restType!.id, lat: 4.5320, lng: -75.6700, desc: "Restaurante campestre" },
    { name: "Restaurante Dar Papaya", type: restType!.id, lat: 4.5540, lng: -75.6580, desc: "Restaurante y bar" },
    { name: "The Grill Station Burger", type: restType!.id, lat: 4.5550, lng: -75.6590, desc: "Hamburguesas" },
    { name: "Coffee Garden Armenia", type: restType!.id, lat: 4.5560, lng: -75.6510, desc: "Café jardín" },
    { name: "Restaurante Tierra Labrantía", type: restType!.id, lat: 4.5370, lng: -75.6650, desc: "Restaurante típico" },
    
    // Eventos y sitios de interés
    { name: "Parque de la Vida", type: parkType!.id, lat: 4.5492, lng: -75.6615, desc: "Parque natural" },
    { name: "Centro Metropolitano de Convenciones", type: parkType!.id, lat: 4.5580, lng: -75.6550, desc: "Convenciones" },
    { name: "Coliseo del Café", type: parkType!.id, lat: 4.5390, lng: -75.6680, desc: "Coliseo deportivo" },
    { name: "Plaza de Bolívar de Armenia", type: parkType!.id, lat: 4.5330, lng: -75.6610, desc: "Plaza principal" },
    { name: "Festival de Velas y Faroles", type: parkType!.id, lat: 4.5100, lng: -75.6800, desc: "Quimbaya - Evento cultural" },
    { name: "Festival de Música Andina Colombiana", type: parkType!.id, lat: 4.5300, lng: -75.6600, desc: "Evento cultural" }
  ];

  for (const p of places) {
    const existing = await prisma.place.findFirst({ where: { cityId: cityArmenia.id, name: p.name } });
    if (!existing) {
      await prisma.place.create({
        data: {
          name: p.name,
          slug: p.name.toLowerCase().replace(/ /g, '-'),
          cityId: cityArmenia.id,
          placeTypeId: p.type,
          ownerUserId: admin!.id,
          status: "PUBLISHED",
          description: p.desc,
          latitude: p.lat,
          longitude: p.lng,
          priceLevel: 2
        }
      });
    }
  }

  console.log("Custom places added.");
}

main().finally(() => prisma.$disconnect());
