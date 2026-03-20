"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setPlaceStatus = exports.listPlaces = exports.getPlaceById = exports.updatePlace = exports.createPlace = void 0;
const prisma_1 = require("../../config/prisma");
const slug_1 = require("../../shared/utils/slug");
const pagination_1 = require("../../shared/utils/pagination");
const time_1 = require("../../shared/utils/time");
const buildUniqueSlug = async (cityId, name) => {
    const base = (0, slug_1.slugify)(name);
    let slug = base;
    let counter = 1;
    while (true) {
        const exists = await prisma_1.prisma.place.findFirst({
            where: { cityId, slug },
            select: { id: true },
        });
        if (!exists)
            return slug;
        counter += 1;
        slug = `${base}-${counter}`;
    }
};
const createPlace = async (data, ownerUserId) => {
    const slug = await buildUniqueSlug(data.cityId, data.name);
    return prisma_1.prisma.place.create({
        data: {
            ownerUserId,
            cityId: data.cityId,
            placeTypeId: data.placeTypeId,
            name: data.name,
            slug,
            description: data.description,
            addressLine: data.addressLine,
            neighborhood: data.neighborhood,
            latitude: data.latitude,
            longitude: data.longitude,
            priceLevel: data.priceLevel,
            status: data.status || "DRAFT",
            contacts: data.contacts ? { create: data.contacts } : undefined,
            socialLinks: data.socialLinks ? { create: data.socialLinks } : undefined,
            openingHours: data.openingHours
                ? {
                    create: data.openingHours.map((h) => ({
                        weekday: h.weekday,
                        openTime: h.openTime ? new Date(`1970-01-01T${h.openTime}Z`) : null,
                        closeTime: h.closeTime ? new Date(`1970-01-01T${h.closeTime}Z`) : null,
                        isClosed: h.isClosed ?? false,
                    })),
                }
                : undefined,
        },
    });
};
exports.createPlace = createPlace;
const updatePlace = async (placeId, data, userId, isAdmin) => {
    const place = await prisma_1.prisma.place.findUnique({ where: { id: placeId } });
    if (!place)
        throw new Error("Lugar no existe");
    if (!isAdmin && place.ownerUserId !== userId) {
        throw new Error("No autorizado");
    }
    const updates = { ...data };
    if (data.name && data.name !== place.name) {
        updates.slug = await buildUniqueSlug(place.cityId, data.name);
    }
    return prisma_1.prisma.place.update({
        where: { id: placeId },
        data: updates,
    });
};
exports.updatePlace = updatePlace;
const getPlaceById = async (placeId) => {
    return prisma_1.prisma.place.findUnique({
        where: { id: placeId },
        include: {
            city: true,
            placeType: true,
            contacts: true,
            socialLinks: true,
            openingHours: true,
            photos: true,
        },
    });
};
exports.getPlaceById = getPlaceById;
const listPlaces = async (query, userId, role) => {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const { skip, take } = (0, pagination_1.getPagination)(page, pageSize);
    const cityId = query.cityId;
    const placeTypeId = query.placeTypeId;
    const status = query.status;
    const search = query.search;
    const priceLevel = query.priceLevel ? Number(query.priceLevel) : undefined;
    const where = {
        deletedAt: null,
    };
    if (cityId)
        where.cityId = cityId;
    if (placeTypeId)
        where.placeTypeId = placeTypeId;
    if (priceLevel)
        where.priceLevel = priceLevel;
    if (search)
        where.name = { contains: search, mode: "insensitive" };
    if (!role || (role !== "ADMIN" && role !== "OWNER")) {
        where.status = "PUBLISHED";
    }
    else if (status) {
        where.status = status;
    }
    const [total, items] = await Promise.all([
        prisma_1.prisma.place.count({ where }),
        prisma_1.prisma.place.findMany({
            where,
            skip,
            take,
            orderBy: { createdAt: "desc" },
            include: {
                city: true,
                placeType: true,
                openingHours: true,
            },
        }),
    ]);
    let results = items;
    if (query.openNow === "true") {
        results = results.filter((place) => {
            const timezone = place.city?.timezone;
            if (!timezone)
                return false;
            return place.openingHours.some((h) => (0, time_1.isOpenNow)(h.weekday, h.openTime, h.closeTime, h.isClosed, timezone));
        });
    }
    return {
        page,
        pageSize,
        total,
        items: results,
    };
};
exports.listPlaces = listPlaces;
const setPlaceStatus = async (placeId, status) => {
    return prisma_1.prisma.place.update({
        where: { id: placeId },
        data: { status },
    });
};
exports.setPlaceStatus = setPlaceStatus;
