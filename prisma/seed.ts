import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Iniciando Siembra Extrema de Ubica2...");

  const password = await bcrypt.hash("12345678", 10);

  // --- Roles ---
  const [adminRole, ownerRole, userRole] = await Promise.all([
    prisma.role.upsert({ where: { code: "ADMIN" }, update: {}, create: { code: "ADMIN", name: "Administrador" } }),
    prisma.role.upsert({ where: { code: "OWNER" }, update: {}, create: { code: "OWNER", name: "Propietario" } }),
    prisma.role.upsert({ where: { code: "USER" }, update: {}, create: { code: "USER", name: "Usuario" } }),
  ]);

  // --- Usuarios ---
  const admin = await prisma.user.upsert({
    where: { email: "admin@ubica2.com" },
    update: {},
    create: { email: "admin@ubica2.com", fullName: "Admin Ubica2", passwordHash: password, userRoles: { create: [{ roleId: adminRole.id }] } },
  });

  const owner = await prisma.user.upsert({
    where: { email: "owner@ubica2.com" },
    update: {},
    create: { email: "owner@ubica2.com", fullName: "Laura Propietaria", passwordHash: password, userRoles: { create: [{ roleId: ownerRole.id }] } },
  });

  const regularUser = await prisma.user.upsert({
    where: { email: "user@ubica2.com" },
    update: {},
    create: { email: "user@ubica2.com", fullName: "Visitante Demo", passwordHash: password, userRoles: { create: [{ roleId: userRole.id }] } },
  });

  // --- Ciudades ---
  const cityArmenia = await prisma.city.upsert({
    where: { countryCode_name_stateRegion: { countryCode: "CO", name: "Armenia", stateRegion: "Quindio" } },
    update: {},
    create: { countryCode: "CO", name: "Armenia", stateRegion: "Quindio", timezone: "America/Bogota" },
  });

  const cityMedellin = await prisma.city.upsert({
    where: { countryCode_name_stateRegion: { countryCode: "CO", name: "Medellin", stateRegion: "Antioquia" } },
    update: {},
    create: { countryCode: "CO", name: "Medellin", stateRegion: "Antioquia", timezone: "America/Bogota" },
  });

  const cityBogota = await prisma.city.upsert({
    where: { countryCode_name_stateRegion: { countryCode: "CO", name: "Bogota", stateRegion: "Cundinamarca" } },
    update: {},
    create: { countryCode: "CO", name: "Bogota", stateRegion: "Cundinamarca", timezone: "America/Bogota" },
  });

  // --- Tipos de Lugar ---
  const [barType, cafeType, clubType, restaurantType, parkType, museumType] = await Promise.all([
    prisma.placeType.upsert({ where: { code: "BAR" }, update: {}, create: { code: "BAR", name: "Bar" } }),
    prisma.placeType.upsert({ where: { code: "CAFE" }, update: {}, create: { code: "CAFE", name: "Café" } }),
    prisma.placeType.upsert({ where: { code: "CLUB" }, update: {}, create: { code: "CLUB", name: "Discoteca" } }),
    prisma.placeType.upsert({ where: { code: "RESTAURANT" }, update: {}, create: { code: "RESTAURANT", name: "Restaurante" } }),
    prisma.placeType.upsert({ where: { code: "PARK" }, update: {}, create: { code: "PARK", name: "Parque" } }),
    prisma.placeType.upsert({ where: { code: "MUSEUM" }, update: {}, create: { code: "MUSEUM", name: "Museo" } }),
  ]);

  // --- Categorías de Eventos ---
  const [salsaCat, technoCat, reggaetonCat, rockCat, gastroCat] = await Promise.all([
    prisma.eventCategory.upsert({ where: { code: "SALSA" }, update: {}, create: { code: "SALSA", name: "Salsa" } }),
    prisma.eventCategory.upsert({ where: { code: "TECHNO" }, update: {}, create: { code: "TECHNO", name: "Techno" } }),
    prisma.eventCategory.upsert({ where: { code: "REGGAETON" }, update: {}, create: { code: "REGGAETON", name: "Reggaetón" } }),
    prisma.eventCategory.upsert({ where: { code: "ROCK" }, update: {}, create: { code: "ROCK", name: "Rock" } }),
    prisma.eventCategory.upsert({ where: { code: "GASTRO" }, update: {}, create: { code: "GASTRO", name: "Gastronómico" } }),
  ]);

  // --- LUGARES REALES EN ARMENIA ---
  
  // 1. La Fogata
  const laFogata = await prisma.place.upsert({
    where: { cityId_slug: { cityId: cityArmenia.id, slug: "la-fogata" } },
    update: {},
    create: {
      ownerUserId: owner.id,
      cityId: cityArmenia.id,
      placeTypeId: restaurantType.id,
      name: "La Fogata",
      slug: "la-fogata",
      description: "El restaurante de mayor tradición en el Quindío. Especialistas en carnes maduradas y cocina internacional en un ambiente elegante.",
      addressLine: "Avenida Bolívar No. 14N-11",
      neighborhood: "Norte",
      latitude: 4.5512,
      longitude: -75.6605,
      priceLevel: 4,
      status: "PUBLISHED",
      photos: { create: [{ url: "https://images.unsplash.com/photo-1550966842-2849a221082b?auto=format&fit=crop&w=800&q=80", sortOrder: 1 }] }
    }
  });

  // 2. Dar Papaya
  const darPapaya = await prisma.place.upsert({
    where: { cityId_slug: { cityId: cityArmenia.id, slug: "dar-papaya" } },
    update: {},
    create: {
      ownerUserId: owner.id,
      cityId: cityArmenia.id,
      placeTypeId: barType.id,
      name: "Dar Papaya",
      slug: "dar-papaya",
      description: "El sitio de rumba cruzada más emblemático de Armenia. Música en vivo, cócteles neón y la mejor energía de la ciudad.",
      addressLine: "Avenida Bolívar Calle 19 Norte",
      neighborhood: "Norte",
      latitude: 4.5620,
      longitude: -75.6560,
      priceLevel: 3,
      status: "PUBLISHED",
      photos: { create: [{ url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80", sortOrder: 1 }] }
    }
  });

  // 3. El Solar Gastrobar
  const elSolar = await prisma.place.upsert({
    where: { cityId_slug: { cityId: cityArmenia.id, slug: "el-solar-gastrobar" } },
    update: {},
    create: {
      ownerUserId: owner.id,
      cityId: cityArmenia.id,
      placeTypeId: restaurantType.id,
      name: "El Solar Gastrobar",
      slug: "el-solar-gastrobar",
      description: "Una mezcla perfecta entre gastronomía de autor y coctelería creativa. Un espacio abierto con diseño moderno y vegetación.",
      addressLine: "Carrera 14 # 21 Norte",
      neighborhood: "Norte",
      latitude: 4.5650,
      longitude: -75.6540,
      priceLevel: 3,
      status: "PUBLISHED",
      photos: { create: [{ url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80", sortOrder: 1 }] }
    }
  });

  // 4. El Bunker
  const elBunker = await prisma.place.upsert({
    where: { cityId_slug: { cityId: cityArmenia.id, slug: "el-bunker" } },
    update: {},
    create: {
      ownerUserId: owner.id,
      cityId: cityArmenia.id,
      placeTypeId: barType.id,
      name: "El Bunker",
      slug: "el-bunker",
      description: "Espeakeasy clandestino con los mejores gin-tonics de la región. Música house y techno suave en un ambiente industrial.",
      addressLine: "Sector Oro Negro",
      neighborhood: "Norte",
      latitude: 4.5680,
      longitude: -75.6510,
      priceLevel: 4,
      status: "PUBLISHED",
      photos: { create: [{ url: "assets/elbunker.jpg", sortOrder: 1 }] }
    }
  });

  // 5. Museo del Oro Quimbaya
  const museoOro = await prisma.place.upsert({
    where: { cityId_slug: { cityId: cityArmenia.id, slug: "museo-del-oro-quimbaya" } },
    update: {},
    create: {
      ownerUserId: admin.id,
      cityId: cityArmenia.id,
      placeTypeId: museumType.id,
      name: "Museo del Oro Quimbaya",
      slug: "museo-del-oro-quimbaya",
      description: "Obra maestra del arquitecto Rogelio Salmona. Alberga la colección arqueológica más importante del Eje Cafetero.",
      addressLine: "Avenida Bolívar Calle 26 Norte",
      neighborhood: "Norte",
      latitude: 4.5615,
      longitude: -75.6565,
      priceLevel: 1,
      status: "PUBLISHED",
      photos: { create: [{ url: "assets/museodeoro.jpg", sortOrder: 1 }] }
    }
  });

  // 6. Parque de la Vida
  const parqueVida = await prisma.place.upsert({
    where: { cityId_slug: { cityId: cityArmenia.id, slug: "parque-de-la-vida" } },
    update: {},
    create: {
      ownerUserId: admin.id,
      cityId: cityArmenia.id,
      placeTypeId: parkType.id,
      name: "Parque de la Vida",
      slug: "parque-de-la-vida",
      description: "El pulmón verde de Armenia. Senderos, lagos y una exuberante vegetación en pleno centro norte.",
      addressLine: "Avenida Bolívar con Calle 10 Norte",
      neighborhood: "Norte",
      latitude: 4.5492,
      longitude: -75.6615,
      priceLevel: 1,
      status: "PUBLISHED",
      photos: { create: [{ url: "assets/ParquedeLaVidaArmenia.jpeg", sortOrder: 1 }] }
    }
  });

  // 7. Café Quindío (Parque Sucre)
  await prisma.place.upsert({
    where: { cityId_slug: { cityId: cityArmenia.id, slug: "cafe-quindio-parque-sucre" } },
    update: {},
    create: {
      ownerUserId: owner.id,
      cityId: cityArmenia.id,
      placeTypeId: cafeType.id,
      name: "Café Quindío Gourmet",
      slug: "cafe-quindio-parque-sucre",
      description: "La mejor experiencia de café en el corazón de Armenia. Degusta los mejores varietales frente al icónico Parque Sucre.",
      addressLine: "Carrera 14 # 12-11 (Parque Sucre)",
      neighborhood: "Centro",
      latitude: 4.5385,
      longitude: -75.6662,
      priceLevel: 2,
      status: "PUBLISHED",
      photos: { create: [{ url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80", sortOrder: 1 }] }
    }
  });

  // 8. Portal del Quindío
  await prisma.place.upsert({
    where: { cityId_slug: { cityId: cityArmenia.id, slug: "portal-del-quindio" } },
    update: {},
    create: {
      ownerUserId: admin.id,
      cityId: cityArmenia.id,
      placeTypeId: restaurantType.id,
      name: "Centro Comercial Portal del Quindío",
      slug: "portal-del-quindio",
      description: "El centro comercial preferido del norte de Armenia. Cine, compras y una excelente plaza de comidas.",
      addressLine: "Avenida Bolívar No. 19 Norte-46",
      neighborhood: "Norte",
      latitude: 4.5580,
      longitude: -75.6585,
      priceLevel: 3,
      status: "PUBLISHED",
      photos: { create: [{ url: "assets/portalquindio.jpg", sortOrder: 1 }] }
    }
  });

  // 9. Restaurante El Roble (Vía Armenia - Pereira)
  await prisma.place.upsert({
    where: { cityId_slug: { cityId: cityArmenia.id, slug: "restaurante-el-roble" } },
    update: {},
    create: {
      ownerUserId: owner.id,
      cityId: cityArmenia.id,
      placeTypeId: restaurantType.id,
      name: "Restaurante El Roble",
      slug: "restaurante-el-roble",
      description: "Parada obligatoria para probar el mejor chicharrón y platos típicos del Quindío. Tradición en la vía.",
      addressLine: "Autopista del Café Km 10",
      neighborhood: "Rural",
      latitude: 4.6050,
      longitude: -75.6200,
      priceLevel: 3,
      status: "PUBLISHED",
      photos: { create: [{ url: "https://images.unsplash.com/photo-1598514983318-2f64f8f4796c?auto=format&fit=crop&w=800&q=80", sortOrder: 1 }] }
    }
  });

  // --- EVENTOS REALISTAS ---

  // Evento en Dar Papaya
  await prisma.event.create({
    data: {
      placeId: darPapaya.id,
      categoryId: salsaCat.id,
      title: "Viernes de Orquesta Viva",
      description: "La mejor orquesta de salsa de la región en vivo. ¡Clases de baile gratis de 8 PM a 9 PM!",
      startTime: new Date("1970-01-01T20:00:00Z"),
      endTime: new Date("1970-01-02T03:00:00Z"),
      status: "ACTIVE",
      priceFrom: 25000,
      recurrence: { create: { weekday: 5 } },
      photos: { create: [{ url: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80" }] }
    } as any
  });

  // Evento en El Bunker
  await prisma.event.create({
    data: {
      placeId: elBunker.id,
      categoryId: technoCat.id,
      title: "Underground Sessions",
      description: "DJ Invitado nacional. Una noche cargada de Progressive House y Techno melódico.",
      startTime: new Date("1970-01-01T22:00:00Z"),
      endTime: new Date("1970-01-02T04:00:00Z"),
      status: "ACTIVE",
      priceFrom: 40000,
      recurrence: { create: { weekday: 6 } },
      photos: { create: [{ url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80" }] }
    } as any
  });

  // Evento Gastronómico en El Solar
  await prisma.event.create({
    data: {
      placeId: elSolar.id,
      categoryId: gastroCat.id,
      title: "Cata de Vinos y Tapas",
      description: "Explora los sabores del viejo mundo guiado por nuestro Sommelier invitado. Incluye 4 copas y maridaje.",
      startTime: new Date("1970-01-01T19:00:00Z"),
      endTime: new Date("1970-01-01T22:00:00Z"),
      status: "ACTIVE",
      priceFrom: 85000,
      recurrence: { create: { weekday: 4 } },
      photos: { create: [{ url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80" }] }
    } as any
  });

  console.log("✨ Siembra Extrema completada con éxito. Armenia está lista.");
}

main()
  .catch((error) => {
    console.error("❌ Error en la siembra:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
