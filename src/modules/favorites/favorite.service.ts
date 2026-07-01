import { prisma } from "../../config/prisma";

export const addFavorite = async (userId: string, placeId: string) => {
  const favorite = await prisma.favorite.upsert({
    where: { userId_placeId: { userId, placeId } },
    update: {},
    create: { userId, placeId },
  });

  await prisma.analyticsEvent.create({
    data: { userId, placeId, eventType: "FAVORITE_ADD" } as any,
  });

  return favorite;
};

export const removeFavorite = async (userId: string, placeId: string) => {
  const result = await prisma.favorite.delete({
    where: { userId_placeId: { userId, placeId } },
  });

  await prisma.analyticsEvent.create({
    data: { userId, placeId, eventType: "FAVORITE_REMOVE" } as any,
  });

  return result;
};

export const listFavorites = async (userId: string) => {
  return prisma.favorite.findMany({
    where: { userId },
    include: {
      place: {
        include: {
          photos: {
            orderBy: { sortOrder: "asc" },
          },
          placeType: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const toggleFavoriteVisited = async (userId: string, placeId: string, isVisited: boolean) => {
  return prisma.favorite.update({
    where: { userId_placeId: { userId, placeId } },
    data: { isVisited },
  });
};
