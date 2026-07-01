import { prisma } from "../../config/prisma";
import { SetPreferenceDTO, SetManyPreferencesDTO } from "./preferences.schema";

const KNOWN_KEYS = [
  "city_id",
  "place_type_id",
  "event_category_id",
  "price_level",
  "notifications_enabled",
  "email_notifications",
  "push_notifications",
  "language",
  "theme",
  "radius_km",
  "default_search_lat",
  "default_search_lng",
  "font_size"
];

export const getUserPreferences = async (userId: string) => {
  const preferences = await prisma.userPreference.findMany({
    where: { userId },
    orderBy: { key: "asc" },
  });

  const result: Record<string, string> = {};
  for (const pref of preferences) {
    result[pref.key] = pref.value;
  }

  return result;
};

export const getFavoriteCategories = async (userId: string) => {
  const favs = await prisma.userFavoriteCategory.findMany({
    where: { userId },
    include: { category: true }
  });
  return favs.map(f => f.category);
};

export const getAllCategories = async () => {
  return await prisma.eventCategory.findMany({
    orderBy: { name: 'asc' }
  });
};

export const setPreference = async (userId: string, data: SetPreferenceDTO) => {
  const preference = await prisma.userPreference.upsert({
    where: {
      userId_key: {
        userId,
        key: data.key,
      },
    },
    update: {
      value: data.value,
    },
    create: {
      userId,
      key: data.key,
      value: data.value,
    },
  });

  return preference;
};

export const setManyPreferences = async (
  userId: string,
  data: SetManyPreferencesDTO
) => {
  const operations = data.preferences.map((pref) =>
    prisma.userPreference.upsert({
      where: {
        userId_key: {
          userId,
          key: pref.key,
        },
      },
      update: {
        value: pref.value,
      },
      create: {
        userId,
        key: pref.key,
        value: pref.value,
      },
    })
  );

  return await prisma.$transaction(operations);
};

export const setManyPreferencesRaw = async (userId: string, prefs: Record<string, string>) => {
  const operations = Object.entries(prefs).map(([key, value]) =>
    prisma.userPreference.upsert({
      where: {
        userId_key: {
          userId,
          key,
        },
      },
      update: {
        value,
      },
      create: {
        userId,
        key,
        value,
      },
    })
  );

  return await prisma.$transaction(operations);
};

export const setFavoriteCategories = async (userId: string, categoryIds: string[]) => {
  await prisma.$transaction(async (tx) => {
    // 1. Limpiar favoritos anteriores de manera segura
    await tx.userFavoriteCategory.deleteMany({
      where: { userId }
    });

    // 2. Insertar las nuevas categorías
    if (categoryIds.length > 0) {
      await tx.userFavoriteCategory.createMany({
        data: categoryIds.map(categoryId => ({
          userId,
          categoryId
        })),
        skipDuplicates: true
      });
    }
  });
};

export const deletePreference = async (userId: string, key: string) => {
  await prisma.userPreference.deleteMany({
    where: { userId, key },
  });

  return { deleted: true };
};

export const getKnownPreferences = async () => {
  return KNOWN_KEYS.map((key) => ({ key }));
};
