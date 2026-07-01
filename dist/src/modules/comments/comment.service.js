"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.likeComment = exports.deleteComment = exports.updateComment = exports.getEntityRatingStats = exports.listComments = exports.createComment = void 0;
const prisma_1 = require("../../config/prisma");
const pagination_1 = require("../../shared/utils/pagination");
const createComment = async (data, userId) => {
    if (data.placeId) {
        const place = await prisma_1.prisma.place.findUnique({ where: { id: data.placeId } });
        if (!place)
            throw new Error("Lugar no encontrado");
    }
    else if (data.eventId) {
        const event = await prisma_1.prisma.event.findUnique({ where: { id: data.eventId } });
        if (!event)
            throw new Error("Evento no encontrado");
    }
    // Anti-spam: No permitir comentarios idénticos seguidos en un tiempo corto
    const lastComment = await prisma_1.prisma.comment.findFirst({
        where: { userId, placeId: data.placeId, eventId: data.eventId },
        orderBy: { createdAt: "desc" },
    });
    if (lastComment && lastComment.content === data.content) {
        throw new Error("Ya publicaste este mismo comentario recientemente.");
    }
    return prisma_1.prisma.comment.create({
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
exports.createComment = createComment;
const listComments = async (query) => {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const { skip, take } = (0, pagination_1.getPagination)(page, pageSize);
    const placeId = query.placeId;
    const eventId = query.eventId;
    const userId = query.userId;
    const onlyGeneral = query.onlyGeneral === "true" || query.onlyGeneral === true;
    const where = { status: { in: ["VISIBLE", "EDITED"] } };
    if (userId) {
        where.userId = userId;
    }
    if (onlyGeneral) {
        where.placeId = null;
        where.eventId = null;
    }
    else {
        if (placeId)
            where.placeId = placeId;
        if (eventId)
            where.eventId = eventId;
    }
    const [total, items, stats] = await Promise.all([
        prisma_1.prisma.comment.count({ where }),
        prisma_1.prisma.comment.findMany({
            where,
            skip,
            take,
            orderBy: { createdAt: "desc" },
            include: {
                user: { select: { id: true, fullName: true, email: true } },
                place: { include: { placeType: true } },
            },
        }),
        prisma_1.prisma.comment.aggregate({
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
exports.listComments = listComments;
// Utilities for place/event services to get stats quickly
const getEntityRatingStats = async (entityType, entityId) => {
    const where = { status: { in: ["VISIBLE", "EDITED"] }, rating: { not: null } };
    where[entityType] = entityId;
    const stats = await prisma_1.prisma.comment.aggregate({
        where,
        _avg: { rating: true },
        _count: { rating: true },
    });
    return {
        averageRating: stats._avg.rating ? Number(stats._avg.rating.toFixed(2)) : null,
        totalRatings: stats._count.rating,
    };
};
exports.getEntityRatingStats = getEntityRatingStats;
const updateComment = async (id, userId, data) => {
    const comment = await prisma_1.prisma.comment.findUnique({ where: { id } });
    if (!comment)
        throw new Error("Reseña no encontrada");
    if (comment.userId !== userId)
        throw new Error("No autorizado para editar esta reseña");
    return prisma_1.prisma.comment.update({
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
exports.updateComment = updateComment;
const deleteComment = async (id, userId) => {
    const comment = await prisma_1.prisma.comment.findUnique({ where: { id } });
    if (!comment)
        throw new Error("Reseña no encontrada");
    if (comment.userId !== userId)
        throw new Error("No autorizado para eliminar esta reseña");
    return prisma_1.prisma.comment.update({
        where: { id },
        data: {
            deletedAt: new Date(),
            status: "HIDDEN",
        },
    });
};
exports.deleteComment = deleteComment;
const likeComment = async (id, increment) => {
    const comment = await prisma_1.prisma.comment.findUnique({ where: { id } });
    if (!comment)
        throw new Error("Reseña no encontrada");
    const currentLikes = comment.likes ?? 0;
    const newLikes = increment ? currentLikes + 1 : Math.max(0, currentLikes - 1);
    return prisma_1.prisma.comment.update({
        where: { id },
        data: { likes: newLikes },
    });
};
exports.likeComment = likeComment;
