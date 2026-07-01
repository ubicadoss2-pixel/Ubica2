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

  // Anti-spam: No permitir comentarios idénticos seguidos en un tiempo corto
  const lastComment = await prisma.comment.findFirst({
    where: { userId, placeId: data.placeId, eventId: data.eventId },
    orderBy: { createdAt: "desc" },
  });

  if (lastComment && lastComment.content === data.content) {
    throw new Error("Ya publicaste este mismo comentario recientemente.");
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
  const userId = query.userId as string | undefined;
  const onlyGeneral = query.onlyGeneral === "true" || query.onlyGeneral === true;

  const where: any = { status: { in: ["VISIBLE", "EDITED"] } };
  
  if (userId) {
    where.userId = userId;
  }
  
  if (onlyGeneral) {
    where.placeId = null;
    where.eventId = null;
  } else {
    if (placeId) where.placeId = placeId;
    if (eventId) where.eventId = eventId;
  }

  const [total, items, stats] = await Promise.all([
    prisma.comment.count({ where }),
    prisma.comment.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        place: { include: { placeType: true } },
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
  const where: any = { status: { in: ["VISIBLE", "EDITED"] }, rating: { not: null } };
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

export const updateComment = async (id: string, userId: string, data: { content?: string; rating?: number }) => {
  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) throw new Error("Reseña no encontrada");
  if (comment.userId !== userId) throw new Error("No autorizado para editar esta reseña");

  return prisma.comment.update({
    where: { id },
    data: {
      content: data.content ?? comment.content,
      rating: data.rating !== undefined ? data.rating : comment.rating,
      status: "EDITED",
    },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
    },
  });
};

export const deleteComment = async (id: string, userId: string) => {
  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) throw new Error("Reseña no encontrada");
  if (comment.userId !== userId) throw new Error("No autorizado para eliminar esta reseña");

  return prisma.comment.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      status: "HIDDEN",
    },
  });
};

export const likeComment = async (id: string, increment: boolean) => {
  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) throw new Error("Reseña no encontrada");

  const currentLikes = comment.likes ?? 0;
  const newLikes = increment ? currentLikes + 1 : Math.max(0, currentLikes - 1);

  return prisma.comment.update({
    where: { id },
    data: { likes: newLikes },
  });
};
