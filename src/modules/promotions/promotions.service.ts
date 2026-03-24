import { prisma } from "../../config/prisma";
import { CreatePromotionDTO, UpdatePromotionDTO } from "./promotions.schema";

export const createPromotion = async (data: CreatePromotionDTO) => {
  return prisma.promotion.create({
    data: {
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
    },
    include: { place: true },
  });
};

export const updatePromotion = async (id: string, data: UpdatePromotionDTO) => {
  const updateData: any = { ...data };
  if (data.startDate) updateData.startDate = new Date(data.startDate);
  if (data.endDate) updateData.endDate = new Date(data.endDate);

  return prisma.promotion.update({
    where: { id },
    data: updateData,
    include: { place: true },
  });
};

export const deletePromotion = async (id: string) => {
  await prisma.promotion.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  return { deleted: true };
};

export const getPromotionsByPlace = async (placeId: string) => {
  const now = new Date();
  return prisma.promotion.findMany({
    where: {
      placeId,
      status: "ACTIVE",
      startDate: { lte: now },
      endDate: { gte: now },
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });
};

export const getActivePromotions = async (
  cityId?: string,
  page = 1,
  pageSize = 20
) => {
  const skip = (page - 1) * pageSize;
  const now = new Date();

  const where: any = {
    status: "ACTIVE",
    startDate: { lte: now },
    endDate: { gte: now },
    deletedAt: null,
  };

  if (cityId) {
    where.place = { cityId };
  }

  const [items, total] = await Promise.all([
    prisma.promotion.findMany({
      where,
      include: { place: { include: { city: true } } },
      orderBy: { endDate: "asc" },
      skip,
      take: pageSize,
    }),
    prisma.promotion.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
};

export const getPromotionByCode = async (code: string) => {
  const now = new Date();
  return prisma.promotion.findFirst({
    where: {
      code,
      status: "ACTIVE",
      startDate: { lte: now },
      endDate: { gte: now },
      deletedAt: null,
    },
    include: { place: true },
  });
};

export const redeemPromotion = async (
  promotionId: string,
  userId: string,
  codeUsed?: string
) => {
  const promotion = await prisma.promotion.findUnique({
    where: { id: promotionId },
  });

  if (!promotion) throw new Error("Promoción no encontrada");
  if (promotion.maxUses && promotion.currentUses >= promotion.maxUses) {
    throw new Error("Promoción agotada");
  }

  const existing = await prisma.promotionRedemption.findFirst({
    where: { promotionId, userId },
  });

  if (existing) throw new Error("Ya canjeaste esta promoción");

  const [redemption] = await prisma.$transaction([
    prisma.promotionRedemption.create({
      data: {
        promotionId,
        userId,
        codeUsed: codeUsed || promotion.code,
      },
    }),
    prisma.promotion.update({
      where: { id: promotionId },
      data: { currentUses: { increment: 1 } },
    }),
  ]);

  return redemption;
};

export const redeemPromotionByCode = async (code: string, userId: string) => {
  const promotion = await getPromotionByCode(code);
  if (!promotion) throw new Error("Código inválido o expirado");

  return redeemPromotion(promotion.id, userId, code);
};
