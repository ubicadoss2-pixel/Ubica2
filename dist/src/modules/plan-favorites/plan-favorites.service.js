"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPlanFavorited = exports.getUserPlanFavorites = exports.removePlanFavorite = exports.addPlanFavorite = void 0;
const prisma_1 = require("../../config/prisma");
const addPlanFavorite = async (userId, planId) => {
    const existing = await prisma_1.prisma.planFavorite.findUnique({
        where: { userId_planId: { userId, planId } },
    });
    if (existing) {
        return existing;
    }
    return prisma_1.prisma.planFavorite.create({
        data: { userId, planId },
        include: { plan: true },
    });
};
exports.addPlanFavorite = addPlanFavorite;
const removePlanFavorite = async (userId, planId) => {
    await prisma_1.prisma.planFavorite.deleteMany({
        where: { userId, planId },
    });
    return { removed: true };
};
exports.removePlanFavorite = removePlanFavorite;
const getUserPlanFavorites = async (userId) => {
    return prisma_1.prisma.planFavorite.findMany({
        where: { userId },
        include: { plan: true },
        orderBy: { createdAt: "desc" },
    });
};
exports.getUserPlanFavorites = getUserPlanFavorites;
const isPlanFavorited = async (userId, planId) => {
    const favorite = await prisma_1.prisma.planFavorite.findUnique({
        where: { userId_planId: { userId, planId } },
    });
    return !!favorite;
};
exports.isPlanFavorited = isPlanFavorited;
