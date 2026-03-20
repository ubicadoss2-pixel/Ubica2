"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listFavorites = exports.removeFavorite = exports.addFavorite = void 0;
const prisma_1 = require("../../config/prisma");
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
    return prisma_1.prisma.favorite.findMany({
        where: { userId },
        include: { place: true },
        orderBy: { createdAt: "desc" },
    });
};
exports.listFavorites = listFavorites;
