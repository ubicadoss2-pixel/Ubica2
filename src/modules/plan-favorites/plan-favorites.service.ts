import { prisma } from "../../config/prisma";

export const addPlanFavorite = async (userId: string, planId: string) => {
  const existing = await prisma.planFavorite.findUnique({
    where: { userId_planId: { userId, planId } },
  });

  if (existing) {
    return existing;
  }

  return prisma.planFavorite.create({
    data: { userId, planId },
    include: { plan: true },
  });
};

export const removePlanFavorite = async (userId: string, planId: string) => {
  await prisma.planFavorite.deleteMany({
    where: { userId, planId },
  });
  return { removed: true };
};

export const getUserPlanFavorites = async (userId: string) => {
  return prisma.planFavorite.findMany({
    where: { userId },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });
};

export const isPlanFavorited = async (userId: string, planId: string) => {
  const favorite = await prisma.planFavorite.findUnique({
    where: { userId_planId: { userId, planId } },
  });
  return !!favorite;
};
