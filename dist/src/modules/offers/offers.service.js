"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOffersByOwner = exports.getActiveOffers = exports.getOffersByPlace = exports.deleteOffer = exports.updateOffer = exports.createOffer = void 0;
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
    const where = {
        status: "ACTIVE",
        endDate: { gte: new Date() },
    };
    if (cityId) {
        where.place = { cityId };
    }
    const [items, total] = await Promise.all([
        prisma_1.prisma.offer.findMany({
            where,
            include: { place: { select: { id: true, name: true, cityId: true } } },
            orderBy: { createdAt: "desc" },
            skip,
            take: pageSize,
        }),
        prisma_1.prisma.offer.count({ where }),
    ]);
    return {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
};
exports.getActiveOffers = getActiveOffers;
const getOffersByOwner = async (ownerUserId) => {
    return prisma_1.prisma.offer.findMany({
        where: { place: { ownerUserId } },
        include: { place: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
    });
};
exports.getOffersByOwner = getOffersByOwner;
