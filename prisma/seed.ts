import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Ubica2...");

  const password = await bcrypt.hash("12345678", 10);

  const [adminRole, ownerRole, userRole] = await Promise.all([
    prisma.role.upsert({
      where: { code: "ADMIN" },
      update: {},
      create: { code: "ADMIN", name: "Admin" },
    }),
    prisma.role.upsert({
      where: { code: "OWNER" },
      update: {},
      create: { code: "OWNER", name: "Owner" },
    }),
    prisma.role.upsert({
      where: { code: "USER" },
      update: {},
      create: { code: "USER", name: "User" },
    }),
  ]);

  const admin = await prisma.user.upsert({
    where: { email: "admin@ubica2.com" },
    update: {},
    create: {
      email: "admin@ubica2.com",
      fullName: "Admin Ubica2",
      passwordHash: password,
      userRoles: { create: [{ roleId: adminRole.id }] },
    },
    include: { userRoles: true },
  });

  const owner = await prisma.user.upsert({
    where: { email: "owner@ubica2.com" },
    update: {},
    create: {
      email: "owner@ubica2.com",
      fullName: "Owner Demo",
      passwordHash: password,
      userRoles: { create: [{ roleId: ownerRole.id }] },
    },
  });

  const regularUser = await prisma.user.upsert({
    where: { email: "user@ubica2.com" },
    update: {},
    create: {
      email: "user@ubica2.com",
      fullName: "User Demo",
      passwordHash: password,
      userRoles: { create: [{ roleId: userRole.id }] },
    },
  });

  const [cityBogota, cityMedellin] = await Promise.all([
    prisma.city.upsert({
      where: {
        countryCode_name_stateRegion: {
          countryCode: "CO",
          name: "Bogota",
          stateRegion: "",
        },
      },
      update: {},
      create: {
        countryCode: "CO",
        name: "Bogota",
        stateRegion: "",
        timezone: "America/Bogota",
      },
    }),
    prisma.city.upsert({
      where: {
        countryCode_name_stateRegion: {
          countryCode: "CO",
          name: "Medellin",
          stateRegion: "Antioquia",
        },
      },
      update: {},
      create: {
        countryCode: "CO",
        name: "Medellin",
        stateRegion: "Antioquia",
        timezone: "America/Bogota",
      },
    }),
    prisma.city.upsert({
      where: {
        countryCode_name_stateRegion: {
          countryCode: "CO",
          name: "Armenia",
          stateRegion: "Quindio",
        },
      },
      update: {},
      create: {
        countryCode: "CO",
        name: "Armenia",
        stateRegion: "Quindio",
        timezone: "America/Bogota",
      },
    }),
  ]);

  const [barType, cafeType, clubType, restaurantType] = await Promise.all([
    prisma.placeType.upsert({
      where: { code: "BAR" },
      update: {},
      create: { code: "BAR", name: "Bar" },
    }),
    prisma.placeType.upsert({
      where: { code: "CAFE" },
      update: {},
      create: { code: "CAFE", name: "Cafe" },
    }),
    prisma.placeType.upsert({
      where: { code: "CLUB" },
      update: {},
      create: { code: "CLUB", name: "Club" },
    }),
    prisma.placeType.upsert({
      where: { code: "RESTAURANT" },
      update: {},
      create: { code: "RESTAURANT", name: "Restaurant" },
    }),
    prisma.placeType.upsert({
      where: { code: "PARK" },
      update: {},
      create: { code: "PARK", name: "Parque" },
    }),
    prisma.placeType.upsert({
      where: { code: "MUSEUM" },
      update: {},
      create: { code: "MUSEUM", name: "Museo" },
    }),
  ]);

  const [salsaCat, technoCat, reggaetonCat] = await Promise.all([
    prisma.eventCategory.upsert({
      where: { code: "SALSA" },
      update: {},
      create: { code: "SALSA", name: "Salsa" },
    }),
    prisma.eventCategory.upsert({
      where: { code: "TECHNO" },
      update: {},
      create: { code: "TECHNO", name: "Techno" },
    }),
    prisma.eventCategory.upsert({
      where: { code: "REGGAETON" },
      update: {},
      create: { code: "REGGAETON", name: "Reggaeton" },
    }),
  ]);

  const placeBogota = await prisma.place.upsert({
    where: {
      cityId_slug: {
        cityId: cityBogota.id,
        slug: "la-terraza",
      },
    },
    update: {},
    create: {
      ownerUserId: owner.id,
      cityId: cityBogota.id,
      placeTypeId: barType.id,
      name: "La Terraza",
      slug: "la-terraza",
      description: "Lugar demo para eventos.",
      addressLine: "Zona Rosa",
      neighborhood: "Chapinero",
      latitude: 4.7110,
      longitude: -74.0721,
      priceLevel: 2,
      status: "PUBLISHED",
      contacts: {
        create: [
          {
            contactType: "WHATSAPP",
            value: "+573000000000",
            isPrimary: true,
          },
        ],
      },
      socialLinks: {
        create: [{ platform: "INSTAGRAM", url: "https://instagram.com/" }],
      },
      openingHours: {
        create: [
          {
            weekday: 4,
            openTime: new Date("1970-01-01T18:00:00Z"),
            closeTime: new Date("1970-01-01T23:59:00Z"),
            isClosed: false,
          },
          {
            weekday: 5,
            openTime: new Date("1970-01-01T18:00:00Z"),
            closeTime: new Date("1970-01-02T02:00:00Z"),
            isClosed: false,
          },
        ],
      },
    },
  });

  const placeMedellin = await prisma.place.upsert({
    where: { cityId_slug: { cityId: cityMedellin.id, slug: "cafe-central" } },
    update: {},
    create: {
      ownerUserId: owner.id,
      cityId: cityMedellin.id,
      placeTypeId: cafeType.id,
      name: "Cafe Central",
      slug: "cafe-central",
      description: "Cafe con musica en vivo.",
      addressLine: "El Poblado",
      neighborhood: "El Poblado",
      latitude: 6.2088,
      longitude: -75.5650,
      priceLevel: 1,
      status: "PUBLISHED",
    },
  });

  const cityArmenia = await prisma.city.findFirst({
    where: { name: "Armenia" },
  });

  if (cityArmenia) {
    await prisma.place.upsert({
      where: { cityId_slug: { cityId: cityArmenia.id, slug: "parque-de-la-vida" } },
      update: {},
      create: {
        ownerUserId: owner.id,
        cityId: cityArmenia.id,
        placeTypeId: (await prisma.placeType.findFirst({ where: { code: "PARK" } }))!.id,
        name: "Parque de la Vida",
        slug: "parque-de-la-vida",
        description: "El pulmón verde de la ciudad, ideal para caminar y disfrutar de la naturaleza.",
        addressLine: "Avenida Bolívar",
        neighborhood: "Norte",
        latitude: 4.5501,
        longitude: -75.6607,
        priceLevel: 1,
        status: "PUBLISHED",
        photos: {
          create: [{ url: "https://images.unsplash.com/photo-1542332213-9b5a5a3fab35?auto=format&fit=crop&w=800&q=60", sortOrder: 1 }]
        }
      },
    });

    await prisma.place.upsert({
      where: { cityId_slug: { cityId: cityArmenia.id, slug: "museo-del-oro-quimbaya" } },
      update: {},
      create: {
        ownerUserId: owner.id,
        cityId: cityArmenia.id,
        placeTypeId: (await prisma.placeType.findFirst({ where: { code: "MUSEUM" } }))!.id,
        name: "Museo del Oro Quimbaya",
        slug: "museo-del-oro-quimbaya",
        description: "Arquitectura de Rogelio Salmona que alberga tesoros de la cultura Quimbaya.",
        addressLine: "Carrera 19 # 18 Norte",
        neighborhood: "Norte",
        latitude: 4.5615,
        longitude: -75.6565,
        priceLevel: 1,
        status: "PUBLISHED",
        photos: {
          create: [{ url: "https://images.unsplash.com/photo-1596401057633-531035783318?auto=format&fit=crop&w=800&q=60", sortOrder: 1 }]
        }
      },
    });
  }

  const eventSalsa = await prisma.event.create({
    data: {
      placeId: placeBogota.id,
      categoryId: salsaCat.id,
      title: "Noche de Salsa",
      description: "Musica en vivo.",
      startTime: new Date("1970-01-01T20:00:00Z"),
      endTime: new Date("1970-01-01T23:00:00Z"),
      status: "ACTIVE",
      recurrence: { create: { weekday: 5 } },
    } as any,
  });

  const eventReggaeton = await prisma.event.create({
    data: {
      placeId: placeMedellin.id,
      categoryId: reggaetonCat.id,
      title: "Reggaeton Night",
      description: "DJ invitado.",
      startTime: new Date("1970-01-01T21:00:00Z"),
      endTime: new Date("1970-01-02T01:00:00Z"),
      status: "ACTIVE",
      recurrence: { create: { weekday: 6 } },
    } as any,
  });

  await prisma.eventSpecialDate.createMany({
    data: [
      {
        eventId: eventSalsa.id,
        eventDate: new Date("2026-02-21"),
        dateType: "OCCURRENCE",
        note: "Edicion especial",
      },
      {
        eventId: eventReggaeton.id,
        eventDate: new Date("2026-02-22"),
        dateType: "OCCURRENCE",
        note: "Edicion Medellin",
      },
    ],
    skipDuplicates: true,
  });

  await prisma.favorite.createMany({
    data: [
      { userId: regularUser.id, placeId: placeBogota.id },
      { userId: regularUser.id, placeId: placeMedellin.id },
    ],
    skipDuplicates: true,
  });

  await prisma.report.createMany({
    data: [
      {
        userId: regularUser.id,
        targetType: "PLACE",
        placeId: placeBogota.id,
        reason: "WRONG_INFO",
        details: "Horario desactualizado.",
      },
      {
        userId: regularUser.id,
        targetType: "EVENT",
        eventId: eventSalsa.id,
        reason: "OTHER",
        details: "Precio no confirmado.",
      },
    ],
  });

  await prisma.analyticsEvent.createMany({
    data: [
      {
        userId: regularUser.id,
        eventType: "PLACE_VIEW",
        placeId: placeBogota.id,
        meta: { source: "seed" },
      },
      {
        userId: regularUser.id,
        eventType: "EVENT_VIEW",
        eventId: eventSalsa.id,
        meta: { source: "seed" },
      },
      {
        eventType: "CONTACT_CLICK",
        placeId: placeMedellin.id,
        meta: { source: "seed" },
      },
    ],
  });

  console.log("Seed listo.");

  // --- Plans ---
  const plans = await Promise.all([
    prisma.plan.upsert({
      where: { id: "11111111-1111-1111-1111-111111111111" },
      update: {},
      create: {
        id: "11111111-1111-1111-1111-111111111111",
        name: "Básico",
        limitPlaces: 1,
        limitEvents: 3,
        price: 29900,
        durationDays: 30,
        isActive: true,
      },
    }),
    prisma.plan.upsert({
      where: { id: "22222222-2222-2222-2222-222222222222" },
      update: {},
      create: {
        id: "22222222-2222-2222-2222-222222222222",
        name: "Profesional",
        limitPlaces: 5,
        limitEvents: 20,
        price: 79000,
        durationDays: 30,
        isActive: true,
      },
    }),
    prisma.plan.upsert({
      where: { id: "33333333-3333-3333-3333-333333333333" },
      update: {},
      create: {
        id: "33333333-3333-3333-3333-333333333333",
        name: "Empresarial",
        limitPlaces: 20,
        limitEvents: 100,
        price: 199000,
        durationDays: 90,
        isActive: true,
      },
    }),
  ]);

  console.log("Planes creados:", plans.map(p => p.name).join(", "));

  // --- Promociones ---
  const promotions = await Promise.all([
    prisma.promotion.createMany({
      data: [
        {
          placeId: placeBogota.id,
          title: "2x1 en cócteles",
          description: "Todos los jueves trae a alguien y el segundo trago es gratis",
          discountType: "BOGO",
          code: "JUEVES20",
          startDate: new Date(),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          status: "ACTIVE",
        },
        {
          placeId: placeMedellin.id,
          title: "20% OFF en entradas",
          description: "Descuento especial en entradas anticipadas",
          discountType: "PERCENTAGE",
          discountValue: 20,
          code: "MEDELLIN20",
          startDate: new Date(),
          endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          status: "ACTIVE",
        },
        {
          placeId: placeBogota.id,
          title: "Combo after office",
          description: "$15.000 incluye pinta + snack",
          discountType: "FIXED",
          discountValue: 15000,
          minPurchase: 15000,
          startDate: new Date(),
          endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
          status: "ACTIVE",
        },
      ],
      skipDuplicates: true,
    }),
  ]);

  console.log("Promociones creadas");

  // --- Preferencias de usuario demo ---
  await Promise.all([
    prisma.userPreference.createMany({
      data: [
        { userId: regularUser.id, key: "city_id", value: cityBogota.id },
        { userId: regularUser.id, key: "notifications_enabled", value: "true" },
        { userId: regularUser.id, key: "radius_km", value: "10" },
        { userId: regularUser.id, key: "theme", value: "light" },
      ],
      skipDuplicates: true,
    }),
  ]);

  console.log("Preferencias creadas");

  // --- Historial de búsqueda demo ---
  await prisma.searchHistory.createMany({
    data: [
      { userId: regularUser.id, query: "bares en bogota", cityId: cityBogota.id, resultsCount: 15 },
      { userId: regularUser.id, query: "fiestas electronica", resultsCount: 8 },
      { userId: regularUser.id, query: "cafes zona rosa", cityId: cityBogota.id, resultsCount: 12 },
    ],
    skipDuplicates: true,
  });

  console.log("Historial de búsqueda creado");

  // --- Plan favorito demo ---
  await prisma.planFavorite.createMany({
    data: [
      { userId: regularUser.id, planId: plans[0].id },
      { userId: regularUser.id, planId: plans[1].id },
    ],
    skipDuplicates: true,
  });

  console.log("Planes favoritos creados");

  console.log("Seed completo!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
