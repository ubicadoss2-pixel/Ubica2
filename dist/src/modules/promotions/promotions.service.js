"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redeemPromotionByCode = exports.redeemPromotion = exports.getPromotionByCode = exports.getActivePromotions = exports.getPromotionsByPlace = exports.deletePromotion = exports.updatePromotion = exports.createPromotion = void 0;
const prisma_1 = require("../../config/prisma");
const createPromotion = async (data) => {
    return prisma_1.prisma.promotion.create({
        data: {
            ...data,
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
        },
        include: { place: true },
    });
};
exports.createPromotion = createPromotion;
const updatePromotion = async (id, data) => {
    const updateData = { ...data };
    if (data.startDate)
        updateData.startDate = new Date(data.startDate);
    if (data.endDate)
        updateData.endDate = new Date(data.endDate);
    return prisma_1.prisma.promotion.update({
        where: { id },
        data: updateData,
        include: { place: true },
    });
};
exports.updatePromotion = updatePromotion;
const deletePromotion = async (id) => {
    await prisma_1.prisma.promotion.update({
        where: { id },
        data: { deletedAt: new Date() },
    });
    return { deleted: true };
};
exports.deletePromotion = deletePromotion;
const getPromotionsByPlace = async (placeId) => {
    const now = new Date();
    return prisma_1.prisma.promotion.findMany({
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
exports.getPromotionsByPlace = getPromotionsByPlace;
const getActivePromotions = async (cityId, page = 1, pageSize = 20) => {
    const skip = (page - 1) * pageSize;
    const now = new Date();
    const where = {
        status: "ACTIVE",
        startDate: { lte: now },
        endDate: { gte: now },
        deletedAt: null,
    };
    if (cityId) {
        where.place = { cityId };
    }
    const [items, total] = await Promise.all([
        prisma_1.prisma.promotion.findMany({
            where,
            include: { place: { include: { city: true } } },
            orderBy: { endDate: "asc" },
            skip,
            take: pageSize,
        }),
        prisma_1.prisma.promotion.count({ where }),
    ]);
    return {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
};
exports.getActivePromotions = getActivePromotions;
const getPromotionByCode = async (code) => {
    const now = new Date();
    return prisma_1.prisma.promotion.findFirst({
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
exports.getPromotionByCode = getPromotionByCode;
const redeemPromotion = async (promotionId, userId, codeUsed) => {
    const promotion = await prisma_1.prisma.promotion.findUnique({
        where: { id: promotionId },
    });
    if (!promotion)
        throw new Error("Promoción no encontrada");
    if (promotion.maxUses && promotion.currentUses >= promotion.maxUses) {
        throw new Error("Promoción agotada");
    }
    const existing = await prisma_1.prisma.promotionRedemption.findFirst({
        where: { promotionId, userId },
    });
    if (existing)
        throw new Error("Ya canjeaste esta promoción");
    const [redemption] = await prisma_1.prisma.$transaction([
        prisma_1.prisma.promotionRedemption.create({
            data: {
                promotionId,
                userId,
                codeUsed: codeUsed || promotion.code,
            },
        }),
        prisma_1.prisma.promotion.update({
            where: { id: promotionId },
            data: { currentUses: { increment: 1 } },
        }),
    ]);
    return redemption;
};
exports.redeemPromotion = redeemPromotion;
const redeemPromotionByCode = async (code, userId) => {
    const promotion = await (0, exports.getPromotionByCode)(code);
    if (!promotion)
        throw new Error("Código inválido o expirado");
    return (0, exports.redeemPromotion)(promotion.id, userId, code);
};
exports.redeemPromotionByCode = redeemPromotionByCode;
