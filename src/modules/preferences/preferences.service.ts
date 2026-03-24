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
  const results = await Promise.all(
    data.preferences.map((pref) =>
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
    )
  );

  return results;
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
