"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listEventCategories = exports.listPlaceTypes = exports.listCities = void 0;
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
