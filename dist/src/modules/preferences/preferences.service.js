"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getKnownPreferences = exports.deletePreference = exports.setFavoriteCategories = exports.setManyPreferencesRaw = exports.setManyPreferences = exports.setPreference = exports.getAllCategories = exports.getFavoriteCategories = exports.getUserPreferences = void 0;
const prisma_1 = require("../../config/prisma");
const KNOWN_KEYS = [
    "city_id",
    "place_type_id",
    "event_category_id",
    "price_level",
    "notifications_enabled",
    "email_notifications",
    "push_notifications",
    "language",
    "theme",
    "radius_km",
    "default_search_lat",
    "default_search_lng",
    "font_size"
];
const getUserPreferences = async (userId) => {
    const preferences = await prisma_1.prisma.userPreference.findMany({
        where: { userId },
        orderBy: { key: "asc" },
    });
    const result = {};
    for (const pref of preferences) {
        result[pref.key] = pref.value;
    }
    return result;
};
exports.getUserPreferences = getUserPreferences;
const getFavoriteCategories = async (userId) => {
    const favs = await prisma_1.prisma.userFavoriteCategory.findMany({
        where: { userId },
        include: { category: true }
    });
    return favs.map(f => f.category);
};
exports.getFavoriteCategories = getFavoriteCategories;
const getAllCategories = async () => {
    return await prisma_1.prisma.eventCategory.findMany({
        orderBy: { name: 'asc' }
    });
};
exports.getAllCategories = getAllCategories;
const setPreference = async (userId, data) => {
    const preference = await prisma_1.prisma.userPreference.upsert({
        where: {
            userId_key: {
                userId,
                key: data.key,
            },
        },
        update: {
            value: data.value,
        },
        create: {
            userId,
            key: data.key,
            value: data.value,
        },
    });
    return preference;
};
exports.setPreference = setPreference;
const setManyPreferences = async (userId, data) => {
    const operations = data.preferences.map((pref) => prisma_1.prisma.userPreference.upsert({
        where: {
            userId_key: {
                userId,
                key: pref.key,
            },
        },
        update: {
            value: pref.value,
        },
        create: {
            userId,
            key: pref.key,
            value: pref.value,
        },
    }));
    return await prisma_1.prisma.$transaction(operations);
};
exports.setManyPreferences = setManyPreferences;
const setManyPreferencesRaw = async (userId, prefs) => {
    const operations = Object.entries(prefs).map(([key, value]) => prisma_1.prisma.userPreference.upsert({
        where: {
            userId_key: {
                userId,
                key,
            },
        },
        update: {
            value,
        },
        create: {
            userId,
            key,
            value,
        },
    }));
    return await prisma_1.prisma.$transaction(operations);
};
exports.setManyPreferencesRaw = setManyPreferencesRaw;
const setFavoriteCategories = async (userId, categoryIds) => {
    await prisma_1.prisma.$transaction(async (tx) => {
        // 1. Limpiar favoritos anteriores de manera segura
        await tx.userFavoriteCategory.deleteMany({
            where: { userId }
        });
        // 2. Insertar las nuevas categorías
        if (categoryIds.length > 0) {
            await tx.userFavoriteCategory.createMany({
                data: categoryIds.map(categoryId => ({
                    userId,
                    categoryId
                })),
                skipDuplicates: true
            });
        }
    });
};
exports.setFavoriteCategories = setFavoriteCategories;
const deletePreference = async (userId, key) => {
    await prisma_1.prisma.userPreference.deleteMany({
        where: { userId, key },
    });
    return { deleted: true };
};
exports.deletePreference = deletePreference;
const getKnownPreferences = async () => {
    return KNOWN_KEYS.map((key) => ({ key }));
};
exports.getKnownPreferences = getKnownPreferences;
