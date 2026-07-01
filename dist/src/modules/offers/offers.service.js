"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveOffers = exports.getOffersByPlace = exports.deleteOffer = exports.updateOffer = exports.createOffer = void 0;
const prisma_1 = require("../../config/prisma");
const createOffer = async (data) => {
    return prisma_1.prisma.offer.create({
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
exports.createOffer = createOffer;
const updateOffer = async (id, data) => {
    return prisma_1.prisma.offer.update({
        where: { id },
        data,
    });
};
exports.updateOffer = updateOffer;
const deleteOffer = async (id) => {
    await prisma_1.prisma.offer.delete({
        where: { id },
    });
};
exports.deleteOffer = deleteOffer;
const getOffersByPlace = async (placeId) => {
    return prisma_1.prisma.offer.findMany({
        where: { placeId },
        orderBy: { createdAt: "desc" },
    });
};
exports.getOffersByPlace = getOffersByPlace;
const getActiveOffers = async (cityId, page = 1, pageSize = 20) => {
    const skip = (page - 1) * pageSize;
    const now = new Date();
    let where = {
        status: "ACTIVE",
        startDate: { lte: now },
        endDate: { gte: now },
    };
    if (cityId) {
        where.place = { cityId };
    }
    const [items, total] = await Promise.all([
        prisma_1.prisma.offer.findMany({
            where,
            skip,
            take: pageSize,
            include: {
                place: {
                    select: { name: true, slug: true, placeType: { select: { name: true } }, city: { select: { name: true } } },
                },
            },
            orderBy: { createdAt: "desc" },
        }),
        prisma_1.prisma.offer.count({ where }),
    ]);
    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
};
exports.getActiveOffers = getActiveOffers;
