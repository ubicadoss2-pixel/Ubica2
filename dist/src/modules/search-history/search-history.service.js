"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSearchHistoryItem = exports.clearUserSearchHistory = exports.getUserSearchHistory = exports.addSearchHistory = void 0;
const prisma_1 = require("../../config/prisma");
const addSearchHistory = async (userId, data) => {
    return prisma_1.prisma.searchHistory.create({
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
exports.addSearchHistory = addSearchHistory;
const getUserSearchHistory = async (userId, limit = 50, page = 1) => {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
        prisma_1.prisma.searchHistory.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
        prisma_1.prisma.searchHistory.count({ where: { userId } }),
    ]);
    return {
        items,
        total,
        page,
        pageSize: limit,
        totalPages: Math.ceil(total / limit),
    };
};
exports.getUserSearchHistory = getUserSearchHistory;
const clearUserSearchHistory = async (userId) => {
    await prisma_1.prisma.searchHistory.deleteMany({
        where: { userId },
    });
    return { cleared: true };
};
exports.clearUserSearchHistory = clearUserSearchHistory;
const deleteSearchHistoryItem = async (userId, id) => {
    await prisma_1.prisma.searchHistory.deleteMany({
        where: { id, userId },
    });
    return { deleted: true };
};
exports.deleteSearchHistoryItem = deleteSearchHistoryItem;
