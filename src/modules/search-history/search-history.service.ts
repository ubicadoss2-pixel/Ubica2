import { prisma } from "../../config/prisma";
import { CreateSearchHistoryDTO } from "./search-history.schema";

export const addSearchHistory = async (
  userId: string,
  data: CreateSearchHistoryDTO
) => {
  return prisma.searchHistory.create({
    data: {
      userId,
      query: data.query,
      cityId: data.cityId,
      placeTypeId: data.placeTypeId,
      latitude: data.latitude,
      longitude: data.longitude,
      radiusKm: data.radiusKm,
      resultsCount: data.resultsCount,
    },
  });
};

export const getUserSearchHistory = async (
  userId: string,
  limit = 50,
  page = 1
) => {
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.searchHistory.count({ where: { userId } }),
  ]);

  return {
    items,
    total,
    page,
    pageSize: limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const clearUserSearchHistory = async (userId: string) => {
  await prisma.searchHistory.deleteMany({
    where: { userId },
  });
  return { cleared: true };
};

export const deleteSearchHistoryItem = async (userId: string, id: string) => {
  await prisma.searchHistory.deleteMany({
    where: { id, userId },
  });
  return { deleted: true };
};
