import { prisma } from "../../config/prisma";
import { getEntityRatingStats } from "../comments/comment.service";

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
  const favorites = await prisma.favorite.findMany({
    where: { userId },
    include: {
      place: {
        include: {
          photos: {
            orderBy: { sortOrder: "asc" },
          },
          placeType: true,
          city: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const favoritesWithRatings = await Promise.all(
    favorites.map(async (favorite) => {
      if (favorite.place) {
        const stats = await getEntityRatingStats("placeId", favorite.place.id);
        (favorite.place as any).averageRating = stats.averageRating ?? null;
        (favorite.place as any).totalRatings = stats.totalRatings ?? 0;
      }
      return favorite;
    })
  );

  return favoritesWithRatings;
};

export const toggleFavoriteVisited = async (userId: string, placeId: string, isVisited: boolean) => {
  return prisma.favorite.update({
    where: { userId_placeId: { userId, placeId } },
    data: { isVisited },
  });
};
