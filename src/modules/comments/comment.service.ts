import { prisma } from "../../config/prisma";
import { CreateCommentDTO } from "./comment.schema";
import { getPagination } from "../../shared/utils/pagination";

export const createComment = async (data: CreateCommentDTO, userId: string) => {
  if (data.placeId) {
    const place = await prisma.place.findUnique({ where: { id: data.placeId } });
    if (!place) throw new Error("Lugar no encontrado");
  } else if (data.eventId) {
    const event = await prisma.event.findUnique({ where: { id: data.eventId } });
    if (!event) throw new Error("Evento no encontrado");
  }

  return prisma.comment.create({
    data: {
      userId,
      placeId: data.placeId,
      eventId: data.eventId,
      content: data.content,
      rating: data.rating,
      status: "VISIBLE",
    },
  });
};

export const listComments = async (query: any) => {
  const page = Number(query.page) || 1;
  const pageSize = Number(query.pageSize) || 10;
  const { skip, take } = getPagination(page, pageSize);

  const placeId = query.placeId as string | undefined;
  const eventId = query.eventId as string | undefined;

  const where: any = { status: "VISIBLE" };
  if (placeId) where.placeId = placeId;
  if (eventId) where.eventId = eventId;

  const [total, items, stats] = await Promise.all([
    prisma.comment.count({ where }),
    prisma.comment.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
    }),
    prisma.comment.aggregate({
      where,
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);

  return {
    page,
    pageSize,
    total,
    items,
    averageRating: stats._avg.rating ? Number(stats._avg.rating.toFixed(2)) : null,
    totalRatings: stats._count.rating,
  };
};

// Utilities for place/event services to get stats quickly
export const getEntityRatingStats = async (entityType: "placeId" | "eventId", entityId: string) => {
  const where: any = { status: "VISIBLE", rating: { not: null } };
  where[entityType] = entityId;

  const stats = await prisma.comment.aggregate({
    where,
    _avg: { rating: true },
    _count: { rating: true },
  });

  return {
    averageRating: stats._avg.rating ? Number(stats._avg.rating.toFixed(2)) : null,
    totalRatings: stats._count.rating,
  };
};
