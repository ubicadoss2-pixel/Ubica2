"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleFavoriteVisited = exports.listFavorites = exports.removeFavorite = exports.addFavorite = void 0;
const prisma_1 = require("../../config/prisma");
const comment_service_1 = require("../comments/comment.service");
const addFavorite = async (userId, placeId) => {
    const favorite = await prisma_1.prisma.favorite.upsert({
        where: { userId_placeId: { userId, placeId } },
        update: {},
        create: { userId, placeId },
    });
    await prisma_1.prisma.analyticsEvent.create({
        data: { userId, placeId, eventType: "FAVORITE_ADD" },
    });
    return favorite;
};
exports.addFavorite = addFavorite;
const removeFavorite = async (userId, placeId) => {
    const result = await prisma_1.prisma.favorite.delete({
        where: { userId_placeId: { userId, placeId } },
    });
    await prisma_1.prisma.analyticsEvent.create({
        data: { userId, placeId, eventType: "FAVORITE_REMOVE" },
    });
    return result;
};
exports.removeFavorite = removeFavorite;
const listFavorites = async (userId) => {
    const favorites = await prisma_1.prisma.favorite.findMany({
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
    const favoritesWithRatings = await Promise.all(favorites.map(async (favorite) => {
        if (favorite.place) {
            const stats = await (0, comment_service_1.getEntityRatingStats)("placeId", favorite.place.id);
            favorite.place.averageRating = stats.averageRating ?? null;
            favorite.place.totalRatings = stats.totalRatings ?? 0;
        }
        return favorite;
    }));
    return favoritesWithRatings;
};
exports.listFavorites = listFavorites;
const toggleFavoriteVisited = async (userId, placeId, isVisited) => {
    return prisma_1.prisma.favorite.update({
        where: { userId_placeId: { userId, placeId } },
        data: { isVisited },
    });
};
exports.toggleFavoriteVisited = toggleFavoriteVisited;
