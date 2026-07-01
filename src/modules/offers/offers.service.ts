import { prisma } from "../../config/prisma";
import { CreateOfferDTO, UpdateOfferDTO } from "./offers.schema";
import { Prisma } from "@prisma/client";

export const createOffer = async (data: CreateOfferDTO) => {
  return prisma.offer.create({
    data: {
      placeId: data.placeId,
      title: data.title,
      description: data.description,
      conditions: data.conditions,
      imageUrl: data.imageUrl,
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status || "ACTIVE",
    },
  });
};

export const updateOffer = async (id: string, data: UpdateOfferDTO) => {
  return prisma.offer.update({
    where: { id },
    data,
  });
};

export const deleteOffer = async (id: string) => {
  await prisma.offer.delete({
    where: { id },
  });
};

export const getOffersByPlace = async (placeId: string) => {
  return prisma.offer.findMany({
    where: { placeId },
    orderBy: { createdAt: "desc" },
  });
};

export const getActiveOffers = async (
  cityId?: string,
  page = 1,
  pageSize = 20
) => {
  const skip = (page - 1) * pageSize;
  const where: any = {
    status: "ACTIVE",
    endDate: { gte: new Date() },
  };

  if (cityId) {
    where.place = { cityId };
  }

  const [items, total] = await Promise.all([
    prisma.offer.findMany({
      where,
      include: { place: { select: { id: true, name: true, cityId: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.offer.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
};

export const getOffersByOwner = async (ownerUserId: string) => {
  return prisma.offer.findMany({
    where: { place: { ownerUserId } },
    include: { place: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
};
