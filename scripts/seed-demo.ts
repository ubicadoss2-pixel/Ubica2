import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const DEMO_DOMAIN = "@ubica2demo.com";
const DEMO_PASSWORD = "DemoUbica2@2026";

async function main() {
  console.log("🚀 Iniciando Siembra de Datos DEMO (Armenia)...");

  // 1. Limpieza iterativa
  console.log("🧹 Limpiando datos DEMO anteriores...");
  await prisma.user.deleteMany({
    where: {
      email: {
        endsWith: DEMO_DOMAIN
      }
    }
  });

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // Obtener roles, ciudad y tipos de lugares (asumimos que ya existen por el seed normal)
  const ownerRole = await prisma.role.findFirst({ where: { code: "OWNER" } });
  const userRole = await prisma.role.findFirst({ where: { code: "USER" } });
  const cityArmenia = await prisma.city.findFirst({ where: { name: "Armenia" } });

  if (!ownerRole || !userRole || !cityArmenia) {
    throw new Error("❌ Debes correr 'npm run db:seed' primero para tener la ciudad y los roles básicos.");
  }

  // Obtener o crear tipos de lugar
  const getPlaceType = async (code: string, name: string) => {
    return prisma.placeType.upsert({
      where: { code },
      update: {},
      create: { code, name }
    });
  };

  const types = {
    RESTAURANT: await getPlaceType("RESTAURANT", "Restaurante"),
    BAR: await getPlaceType("BAR", "Bar"),
    CAFE: await getPlaceType("CAFE", "Café"),
    HOTEL: await getPlaceType("HOTEL", "Hotel"),
    MALL: await getPlaceType("MALL", "Centro Comercial"),
    ICE_CREAM: await getPlaceType("ICE_CREAM", "Heladería"),
    BAKERY: await getPlaceType("BAKERY", "Panadería"),
    PARK: await getPlaceType("PARK", "Parque"),
    MUSEUM: await getPlaceType("MUSEUM", "Museo"),
    GYM: await getPlaceType("GYM", "Gimnasio"),
    CULTURAL: await getPlaceType("CULTURAL", "Centro Cultural"),
    TECH: await getPlaceType("TECH", "Tecnología"),
    CLINIC: await getPlaceType("CLINIC", "Clínica"),
    BEAUTY: await getPlaceType("BEAUTY", "Salón de Belleza"),
    FAST_FOOD: await getPlaceType("FAST_FOOD", "Comida Rápida")
  };

  // Categorías de eventos
  const getEventCategory = async (code: string, name: string) => {
    return prisma.eventCategory.upsert({
      where: { code },
      update: {},
      create: { code, name }
    });
  };

  const categories = {
    MUSIC: await getEventCategory("MUSIC", "Música en Vivo"),
    FOOD: await getEventCategory("FOOD", "Gastronomía"),
    SALE: await getEventCategory("SALE", "Descuentos"),
    CULTURE: await getEventCategory("CULTURE", "Cultura"),
    SPORTS: await getEventCategory("SPORTS", "Deportes"),
    HEALTH: await getEventCategory("HEALTH", "Salud")
  };

  // Generar pool de usuarios simulados
  console.log("👥 Generando 30 usuarios simulados para interacciones...");
  const simulatedUsers = [];
  for (let i = 1; i <= 30; i++) {
    const user = await prisma.user.create({
      data: {
        email: `cliente${i}${DEMO_DOMAIN}`,
        fullName: `Cliente Demo ${i}`,
        passwordHash,
        userRoles: { create: [{ roleId: userRole.id }] }
      }
    });
    simulatedUsers.push(user);
  }

  // Lista de 30 lugares en Armenia
  const demoPlaces = [
    { name: "La Fogata", slug: "la-fogata-demo", email: "lafogata", type: types.RESTAURANT.id, lat: 4.5512, lng: -75.6605, desc: "El restaurante de mayor tradición en el Quindío.", price: 4, cat: categories.FOOD, address: "Avenida Bolívar No. 14N-11" },
    { name: "Dar Papaya", slug: "dar-papaya-demo", email: "darpapaya", type: types.BAR.id, lat: 4.5620, lng: -75.6560, desc: "El sitio de rumba cruzada más emblemático.", price: 3, cat: categories.MUSIC, address: "Av. Bolívar Calle 19 Norte" },
    { name: "El Solar Gastrobar", slug: "el-solar-demo", email: "elsolar", type: types.RESTAURANT.id, lat: 4.5650, lng: -75.6540, desc: "Gastronomía de autor y coctelería.", price: 3, cat: categories.FOOD, address: "Carrera 14 # 21 Norte" },
    { name: "Bianco Restaurante", slug: "bianco-demo", email: "bianco", type: types.RESTAURANT.id, lat: 4.5582, lng: -75.6558, desc: "Restaurante moderno con platillos internacionales.", price: 3, cat: categories.FOOD, address: "Norte" },
    { name: "Restaurante El Roble", slug: "el-roble-demo", email: "elroble", type: types.RESTAURANT.id, lat: 4.6050, lng: -75.6200, desc: "Tradición en la vía al Quindío.", price: 2, cat: categories.FOOD, address: "Autopista del Café" },
    { name: "Los Camellos", slug: "los-camellos-demo", email: "loscamellos", type: types.FAST_FOOD.id, lat: 4.5300, lng: -75.6700, desc: "Las mejores comidas rápidas de Armenia.", price: 1, cat: categories.FOOD, address: "Centro" },
    { name: "Rancho Eden", slug: "rancho-eden-demo", email: "ranchoeden", type: types.RESTAURANT.id, lat: 4.4500, lng: -75.7200, desc: "Restaurante campestre espectacular.", price: 3, cat: categories.FOOD, address: "Vía Aeropuerto" },
    { name: "Café Quindío Parque Sucre", slug: "cafe-quindio-sucre-demo", email: "cafequindio.sucre", type: types.CAFE.id, lat: 4.5385, lng: -75.6662, desc: "Café premium en el Parque Sucre.", price: 2, cat: categories.FOOD, address: "Parque Sucre" },
    { name: "Boticas Café", slug: "boticas-demo", email: "boticas", type: types.CAFE.id, lat: 4.5450, lng: -75.6600, desc: "Un lugar para disfrutar del buen café.", price: 2, cat: categories.FOOD, address: "Av Bolivar" },
    { name: "Lucerna", slug: "lucerna-demo", email: "lucerna", type: types.BAKERY.id, lat: 4.5350, lng: -75.6670, desc: "Pastelería y repostería tradicional.", price: 2, cat: categories.FOOD, address: "Centro" },
    { name: "Heladería El Naranjal", slug: "elnaranjal-demo", email: "elnaranjal", type: types.ICE_CREAM.id, lat: 4.5320, lng: -75.6650, desc: "Helados y ensaladas de frutas.", price: 1, cat: categories.FOOD, address: "Centro" },
    { name: "Pan y Miel", slug: "pan-miel-demo", email: "panymiel", type: types.BAKERY.id, lat: 4.5400, lng: -75.6620, desc: "Panadería fresca todos los días.", price: 1, cat: categories.FOOD, address: "Norte" },
    { name: "Hotel Mocawa Plaza", slug: "mocawa-plaza-demo", email: "mocawaplaza", type: types.HOTEL.id, lat: 4.5510, lng: -75.6590, desc: "Hotel 5 estrellas en Armenia.", price: 5, cat: categories.CULTURE, address: "Av Bolivar" },
    { name: "Hotel Armenia", slug: "hotel-armenia-demo", email: "hotelarmenia", type: types.HOTEL.id, lat: 4.5380, lng: -75.6630, desc: "Tradición y comodidad.", price: 4, cat: categories.CULTURE, address: "Centro" },
    { name: "Isa Victory Hotel", slug: "isa-victory-demo", email: "isavictory", type: types.HOTEL.id, lat: 4.5590, lng: -75.6550, desc: "Boutique hotel de lujo.", price: 4, cat: categories.CULTURE, address: "Norte" },
    { name: "Allure Aroma Mocawa Hotel", slug: "allure-aroma-demo", email: "allurearoma", type: types.HOTEL.id, lat: 4.5520, lng: -75.6580, desc: "Sofisticación en la ciudad.", price: 5, cat: categories.CULTURE, address: "Av Bolivar" },
    { name: "El Bunker", slug: "elbunker-demo", email: "elbunker", type: types.BAR.id, lat: 4.5680, lng: -75.6510, desc: "Bar clandestino con buena música.", price: 3, cat: categories.MUSIC, address: "Oro Negro" },
    { name: "Sky Lounge Mocawa", slug: "skylounge-demo", email: "skylounge", type: types.BAR.id, lat: 4.5511, lng: -75.6591, desc: "Vista espectacular de Armenia.", price: 4, cat: categories.MUSIC, address: "Azotea Mocawa" },
    { name: "Keops Disco Club", slug: "keops-demo", email: "keops", type: types.BAR.id, lat: 4.5400, lng: -75.6600, desc: "Discoteca crossover.", price: 3, cat: categories.MUSIC, address: "Centro" },
    { name: "Portal del Quindío", slug: "portal-quindio-demo", email: "portalquindio", type: types.MALL.id, lat: 4.5580, lng: -75.6585, desc: "Centro comercial, cine y compras.", price: 3, cat: categories.SALE, address: "Av Bolivar" },
    { name: "Unicentro Armenia", slug: "unicentro-armenia-demo", email: "unicentro", type: types.MALL.id, lat: 4.5450, lng: -75.6600, desc: "Las mejores marcas en un solo lugar.", price: 3, cat: categories.SALE, address: "Carrera 14" },
    { name: "Centro Comercial Calima", slug: "calima-demo", email: "calima", type: types.MALL.id, lat: 4.5300, lng: -75.6700, desc: "Todo lo que necesitas, al mejor precio.", price: 2, cat: categories.SALE, address: "Avenida Centenario" },
    { name: "Museo del Oro Quimbaya", slug: "museo-oro-demo", email: "museooro", type: types.MUSEUM.id, lat: 4.5615, lng: -75.6565, desc: "Colección arqueológica importante.", price: 1, cat: categories.CULTURE, address: "Av Bolivar Calle 26 N" },
    { name: "Parque de la Vida", slug: "parque-vida-demo", email: "parquevida", type: types.PARK.id, lat: 4.5492, lng: -75.6615, desc: "Pulmón verde de Armenia.", price: 1, cat: categories.CULTURE, address: "Av Bolivar Calle 10 N" },
    { name: "Centro Metropolitano", slug: "convenciones-demo", email: "convenciones", type: types.CULTURAL.id, lat: 4.5350, lng: -75.6650, desc: "Centro de convenciones de Armenia.", price: 2, cat: categories.CULTURE, address: "Centro" },
    { name: "Smart Fit Portal", slug: "smartfit-demo", email: "smartfit", type: types.GYM.id, lat: 4.5580, lng: -75.6585, desc: "Tu gimnasio inteligente.", price: 2, cat: categories.SPORTS, address: "Portal del Quindio" },
    { name: "Bodytech Armenia", slug: "bodytech-demo", email: "bodytech", type: types.GYM.id, lat: 4.5450, lng: -75.6600, desc: "Centro médico deportivo.", price: 3, cat: categories.SPORTS, address: "Unicentro" },
    { name: "Mac Center Unicentro", slug: "maccenter-demo", email: "maccenter", type: types.TECH.id, lat: 4.5450, lng: -75.6600, desc: "Tus productos Apple favoritos.", price: 4, cat: categories.SALE, address: "Unicentro" },
    { name: "Clínica Central", slug: "clinica-central-demo", email: "clinicacentral", type: types.CLINIC.id, lat: 4.5350, lng: -75.6600, desc: "Salud e IPS en Armenia.", price: 3, cat: categories.HEALTH, address: "Centro" },
    { name: "D'Luxe Armenia", slug: "dluxe-demo", email: "dluxe", type: types.BEAUTY.id, lat: 4.5500, lng: -75.6550, desc: "Salón de belleza y spa.", price: 3, cat: categories.HEALTH, address: "Norte" }
  ];

  console.log("🏙️ Creando 30 comercios DEMO con eventos, ofertas y reseñas...");
  for (const place of demoPlaces) {
    const ownerEmail = `${place.email}${DEMO_DOMAIN}`;
    // Crear el owner
    const ownerUser = await prisma.user.create({
      data: {
        email: ownerEmail,
        fullName: `Propietario ${place.name}`,
        passwordHash,
        userRoles: { create: [{ roleId: ownerRole.id }] }
      }
    });

    // Crear el lugar
    const newPlace = await prisma.place.create({
      data: {
        ownerUserId: ownerUser.id,
        cityId: cityArmenia.id,
        placeTypeId: place.type,
        name: place.name,
        slug: place.slug,
        description: place.desc + " [Este es un lugar de demostración]",
        addressLine: place.address,
        neighborhood: "Armenia",
        latitude: place.lat,
        longitude: place.lng,
        priceLevel: place.price,
        status: "PUBLISHED",
        photos: {
          create: [
            { url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80", sortOrder: 1 },
            { url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80", sortOrder: 2 }
          ]
        },
        openingHours: {
          create: Array.from({length: 7}).map((_, i) => ({
            weekday: i,
            openTime: new Date("1970-01-01T08:00:00Z"),
            closeTime: new Date("1970-01-01T20:00:00Z"),
            isClosed: false
          }))
        }
      }
    });

    // Crear Eventos (2 a 5)
    const numEvents = Math.floor(Math.random() * 4) + 2;
    for (let i = 0; i < numEvents; i++) {
      await prisma.event.create({
        data: {
          placeId: newPlace.id,
          categoryId: place.cat.id,
          title: `Evento Especial ${i+1} en ${place.name}`,
          description: `Una experiencia única que no te puedes perder. Evento de demostración con música, comida y un ambiente inmejorable.`,
          startTime: new Date("1970-01-01T18:00:00Z"),
          endTime: new Date("1970-01-01T23:00:00Z"),
          status: "ACTIVE",
          priceFrom: Math.random() * 50000,
          photos: {
            create: [{ url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80" }]
          }
        }
      });
    }

    // Crear Ofertas (2 a 4)
    const numOffers = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < numOffers; i++) {
      await prisma.offer.create({
        data: {
          placeId: newPlace.id,
          title: `Descuento ${i+1} en ${place.name}`,
          description: `Aprovecha esta increíble oferta en nuestro local presentando tu cuenta de Ubica2.`,
          startDate: new Date(),
          endDate: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000), // +30 days
          status: "ACTIVE",
          imageUrl: "https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=800&q=80"
        }
      });
    }

    // Reseñas (15 a 40)
    const numReviews = Math.floor(Math.random() * 26) + 15;
    const shuffledUsers = [...simulatedUsers].sort(() => 0.5 - Math.random()).slice(0, numReviews);
    for (const simUser of shuffledUsers) {
      const reviewText = ["Excelente lugar, me encantó la experiencia.", "Muy recomendado, volveré pronto.", "El mejor servicio y ambiente.", "Increíble lugar, superó mis expectativas.", "Buena atención y excelentes precios."];
      
      await prisma.comment.create({
        data: {
          userId: simUser.id,
          placeId: newPlace.id,
          content: `${reviewText[Math.floor(Math.random() * reviewText.length)]} (Review autogenerado)`,
          rating: Math.floor(Math.random() * 3) + 3, // 3, 4, 5
          status: "VISIBLE"
        }
      });
      
      // Añadir favoritos
      if (Math.random() > 0.5) {
        await prisma.favorite.create({
          data: {
            userId: simUser.id,
            placeId: newPlace.id
          }
        });
      }

      // Añadir reservas
      if (Math.random() > 0.8) {
        await prisma.reservation.create({
          data: {
            placeId: newPlace.id,
            userId: simUser.id,
            guestName: simUser.fullName || 'Demo',
            date: "2026-10-10",
            time: "19:00",
            guests: 2
          }
        });
      }

      // Analíticas (Visitas)
      await prisma.analyticsEvent.create({
        data: {
          userId: simUser.id,
          placeId: newPlace.id,
          eventType: "PLACE_VIEW",
          occurredAt: new Date(new Date().getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000) // fecha aleatoria ultimos 30 dias
        }
      });
    }
  }

  console.log("✅ Siembra de Datos DEMO finalizada con éxito.");
}

main()
  .catch((e) => {
    console.error("❌ Error en la siembra DEMO:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
