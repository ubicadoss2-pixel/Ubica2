"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMapData = exports.listEventCategories = exports.listPlaceTypes = exports.listCities = void 0;
const prisma_1 = require("../../config/prisma");
const listCities = () => {
    return prisma_1.prisma.city.findMany({ orderBy: { name: "asc" } });
};
exports.listCities = listCities;
const listPlaceTypes = () => {
    return prisma_1.prisma.placeType.findMany({ orderBy: { name: "asc" } });
};
exports.listPlaceTypes = listPlaceTypes;
const listEventCategories = () => {
    return prisma_1.prisma.eventCategory.findMany({ orderBy: { name: "asc" } });
};
exports.listEventCategories = listEventCategories;
const getMapData = async () => {
    const [places, events] = await Promise.all([
        prisma_1.prisma.place.findMany({
            where: { status: "PUBLISHED", latitude: { not: null }, longitude: { not: null }, deletedAt: null },
            select: { id: true, name: true, addressLine: true, postalCode: true, latitude: true, longitude: true },
        }),
        prisma_1.prisma.event.findMany({
            where: { status: "ACTIVE", latitude: { not: null }, longitude: { not: null }, deletedAt: null },
            select: { id: true, title: true, addressLine: true, postalCode: true, latitude: true, longitude: true },
        }),
    ]);
    const mapPlaces = places.map((p) => ({
        id: p.id,
        type: "place",
        title: p.name,
        addressLine: p.addressLine,
        postalCode: p.postalCode,
        latitude: p.latitude !== null ? Number(p.latitude) : null,
        longitude: p.longitude !== null ? Number(p.longitude) : null,
    }));
    const mapEvents = events.map((e) => ({
        id: e.id,
        type: "event",
        title: e.title,
        addressLine: e.addressLine,
        postalCode: e.postalCode,
        latitude: e.latitude !== null ? Number(e.latitude) : null,
        longitude: e.longitude !== null ? Number(e.longitude) : null,
    }));
    return [...mapPlaces, ...mapEvents];
};
exports.getMapData = getMapData;
